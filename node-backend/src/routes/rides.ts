import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';
import { cacheService, cacheKeys, cacheTTL } from '../services/cacheService';
import { validateSearchLocations, validateLocation, validateState, LocationObject } from '../utils/locationValidation';
import { calculateDistance } from '../utils/distanceCalculator';
import { isWeekendOrFestival } from '../utils/helpers';
import axios from "axios";
import polyline from "@mapbox/polyline";
import { config } from '../config/environment';

const router = express.Router();

// Public endpoint to get surge pricing settings (for drivers to see current rates)
router.get('/surge-pricing-settings', async (req, res) => {
  try {
    const { city } = req.query; // Optional city parameter

    let cacheKey = 'admin:surge-pricing-settings:global';
    if (city) {
      cacheKey = `admin:surge-pricing-settings:city:${city}`;
    }

    // Try to get from cache
    const cachedSettings = await cacheService.get(cacheKey);
    if (cachedSettings) {
      return res.json({ settings: cachedSettings, scope: city ? 'city' : 'global' });
    }

    // Default global settings
    const defaultSettings = {
      enabled: true,
      multiplier: 1.25,
      basePricePerKm: 7,
      scope: city ? 'city' : 'global',
      city: city || null,
    };

    res.json({ settings: defaultSettings, scope: city ? 'city' : 'global' });
  } catch (error: any) {
    console.error('Get surge pricing settings error:', error);
    res.status(500).json({ error: error.message || 'Failed to get surge pricing settings' });
  }
});

// Helper function to extract city from location string (simple extraction)
const extractCityFromLocation = (location: string): string | null => {
  // Simple city extraction - in production, use reverse geocoding
  const cities = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'];
  for (const city of cities) {
    if (location.toLowerCase().includes(city.toLowerCase())) {
      return city;
    }
  }
  return null;
};


async function getCityAndState(lat: number, lng: number) {
  const url = "https://maps.googleapis.com/maps/api/geocode/json";

  const response = await axios.get(url, {
    params: {
      latlng: `${lat},${lng}`,
      key: process.env.GOOGLE_MAPS_API_KEY,
    },
  });

  const result = response.data.results?.[0];
  if (!result) return { city: null, state: null };

  let city: string | null = null;
  let state: string | null = null;

  for (const component of result.address_components) {
    if (component.types.includes("locality")) {
      city = component.long_name;
    }

    if (component.types.includes("administrative_area_level_1")) {
      state = component.long_name;
    }
  }

  // fallback if locality missing
  if (!city) {
    const district = result.address_components.find((c: any) =>
      c.types.includes("administrative_area_level_2")
    );
    city = district?.long_name ?? null;
  }

  return { city, state };
}

function decodePolyline(encoded: string) {
  return polyline.decode(encoded).map(([lat, lng]) => ({ lat, lng }));
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function addISTOffset(date: Date) {
  // 5 hours 30 minutes in milliseconds
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
  if (config.nodeEnv === 'development') {
  return new Date(date.getTime());
  }
  return new Date(date.getTime() - IST_OFFSET_MS);
}

function subtractISTOffset(date: Date) {
  // 5 hours 30 minutes in milliseconds
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
  if (config.nodeEnv === 'development') {
  return new Date(date.getTime());
  }
  return new Date(date.getTime() - IST_OFFSET_MS);
}

function buildTimeSlotRanges(date, timeSlots) {
  if (!timeSlots) return [];

  return timeSlots.split(',').map(slot => {
    const [startHour, endHour] = slot.split('-').map(Number);

    // IST times coming from UI
    const startIST = new Date(
      `${date}T${String(startHour).padStart(2, '0')}:00:00`
    );
    const endIST = new Date(
      `${date}T${String(endHour).padStart(2, '0')}:00:00`
    );

    // Convert IST → UTC
    const startUTC = subtractISTOffset(startIST);
    const endUTC = subtractISTOffset(endIST);

    return {
      scheduled_time: {
        gte: startUTC,
        lt: endUTC,
      },
    };
  });
}


function findNearestIndexOnRoute(point, routePoints, bufferKm) {
  for (let i = 0; i < routePoints.length; i++) {
    const d = haversineKm(
      point.lat,
      point.lng,
      routePoints[i].lat,
      routePoints[i].lng
    );

    if (d <= bufferKm) return i;
  }
  return -1;
}

// Helper function to extract searchable parts from location string
// Splits location into meaningful parts for partial matching
const extractLocationParts = (location: string): string[] => {
  if (!location) return [];

  const parts: string[] = [];

  // First, extract city if present (cities are important search terms)
  const city = extractCityFromLocation(location);
  if (city) {
    parts.push(city);
  }

  // Split by commas first (addresses typically use commas as major separators)
  const commaParts = location.split(',').map(part => part.trim()).filter(part => part.length > 0);

  // For each comma-separated part, extract meaningful sub-parts
  commaParts.forEach(part => {
    // Skip if it's just a city (already added)
    if (city && part.toLowerCase().includes(city.toLowerCase())) {
      return;
    }

    // Add the full comma-separated part (e.g., "Gagan Mahal, Agdi Bajar")
    if (part.length > 3) {
      parts.push(part);
    }

    // Also split by spaces to get individual words/phrases
    const words = part.split(/\s+/).filter(word => word.length > 2);

    // Add 2-word combinations (e.g., "Gagan Mahal", "Agdi Bajar")
    for (let i = 0; i < words.length - 1; i++) {
      const twoWord = `${words[i]} ${words[i + 1]}`;
      if (twoWord.length > 4) {
        parts.push(twoWord);
      }
    }

    // Add individual significant words
    words.forEach(word => {
      if (word.length > 3 && !parts.includes(word)) {
        parts.push(word);
      }
    });
  });

  // Remove duplicates and return
  return [...new Set(parts)];
};

// Publish Ride (Pickup → Stops → Drop)
router.post('/', authenticate, authorize('driver'), async (req: AuthRequest, res) => {
  try {
    const {
      vehicleId,
      pickupLocation,
      pickupLatitude,
      pickupLongitude,
      dropLocation,
      dropLatitude,
      dropLongitude,
      stops, // Array of {location, latitude, longitude}
      scheduledDate,
      scheduledTime,
      scheduledDateTime, // ISO string format (alternative to scheduledDate + scheduledTime)
      seatsAvailable,
      pricePerSeat,
      perKmRate,
      distanceKm,
      routePolyline,
      routeDurationMin,
      routeDistanceKm,
      routeBufferKm
      // isSurge is no longer accepted from driver - determined automatically by admin settings
    } = req.body;

    // Validate required fields
    if (!pickupLocation || !dropLocation) {
      return res.status(400).json({ error: 'Pickup and drop locations are required' });
    }

    if (!pickupLatitude || !pickupLongitude || !dropLatitude || !dropLongitude) {
      return res.status(400).json({ error: 'Pickup and drop coordinates are required' });
    }

    const startMeta = await getCityAndState(
      parseFloat(pickupLatitude),
      parseFloat(pickupLongitude)
    );

    const endMeta = await getCityAndState(
      parseFloat(dropLatitude),
      parseFloat(dropLongitude)
    );

    console.log(startMeta);
    // { city: "Odela", state: "Telangana" }

    console.log(endMeta);
    // { city: "Hyderabad", state: "Telangana" }

    // ✅ STRICT STATE VALIDATION - Both states must be active in service_states table
    // Backend validation: never trust frontend location data
    if (!startMeta.state || !endMeta.state) {
      return res.status(400).json({ error: 'Services are not available for the location you are searching.' });
    }

    const pickupStateValidation = await validateState(startMeta.state);
    if (!pickupStateValidation.isValid) {
      return res.status(400).json({ error: pickupStateValidation.error });
    }

    const dropStateValidation = await validateState(endMeta.state);
    if (!dropStateValidation.isValid) {
      return res.status(400).json({ error: dropStateValidation.error });
    }

    // Handle both scheduledDateTime (ISO string) and separate scheduledDate/scheduledTime
    let scheduledDateTimeObj: Date;
    if (scheduledDateTime) {
      // If scheduledDateTime is provided as ISO string, use it directly
      scheduledDateTimeObj = new Date(scheduledDateTime);
      if (isNaN(scheduledDateTimeObj.getTime())) {
        return res.status(400).json({ error: 'Invalid scheduledDateTime format. Use ISO string format.' });
      }
    } else if (scheduledDate && scheduledTime) {
      // If separate date and time are provided, combine them
      scheduledDateTimeObj = new Date(`${scheduledDate}T${scheduledTime}`);
      if (isNaN(scheduledDateTimeObj.getTime())) {
        return res.status(400).json({ error: 'Invalid date or time format' });
      }
    } else {
      return res.status(400).json({ error: 'Either scheduledDateTime (ISO string) or both scheduledDate and scheduledTime are required' });
    }

    if (!seatsAvailable || seatsAvailable < 1) {
      return res.status(400).json({ error: 'At least 1 seat is required' });
    }

    if (!pricePerSeat || pricePerSeat <= 0) {
      return res.status(400).json({ error: 'Price per seat must be greater than 0' });
    }

    if (scheduledDateTimeObj <= new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: req.user!.userId },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            mobile: true,
          },
        },
        vehicles: {
          where: { is_active: true },
        },
      },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Check KYC approval
    if (driver.kyc_status !== 'approved') {
      return res.status(403).json({ error: 'KYC must be approved before publishing rides' });
    }

    // Validate and set vehicle (use selected active car)
    const activeVehicleId = vehicleId || (driver.vehicles.length > 0 ? driver.vehicles[0].id : null);

    if (!activeVehicleId) {
      return res.status(400).json({ error: 'No active vehicle found. Please activate a vehicle first.' });
    }

    // Validate vehicle belongs to driver
    const vehicle = driver.vehicles.find((v) => v.id === activeVehicleId);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found or not active' });
    }

    // Get surge pricing settings (per city or global)
    const city = extractCityFromLocation(pickupLocation) || extractCityFromLocation(dropLocation);
    let surgeSettings;

    console.log(`[Surge Pricing] Extracted city from locations: ${city || 'none'}`);

    if (city) {
      // Try city-specific settings first
      const cityCacheKey = `admin:surge-pricing-settings:city:${city}`;
      surgeSettings = await cacheService.get(cityCacheKey);
      console.log(`[Surge Pricing] City-specific settings for ${city}:`, surgeSettings ? 'found' : 'not found');
    }

    // Fallback to global settings
    if (!surgeSettings) {
      const globalCacheKey = 'admin:surge-pricing-settings:global';
      const globalSettings = await cacheService.get(globalCacheKey);
      surgeSettings = globalSettings || {
        enabled: true,
        multiplier: 1.25,
        basePricePerKm: 7,
        scope: 'global',
      };
      console.log(`[Surge Pricing] Using ${surgeSettings === globalSettings ? 'cached global' : 'default'} settings:`, surgeSettings);
    }

    // Type-safe surge settings
    const surgeSettingsTyped: {
      enabled: boolean;
      multiplier: number;
      basePricePerKm: number;
      scope?: string;
    } = surgeSettings as any;

    // Check if scheduled date is weekend or festival (for logging purposes)
    const isWeekendOrFestivalDate = isWeekendOrFestival(scheduledDateTimeObj);
    console.log(`[Surge Pricing] Scheduled date: ${scheduledDateTimeObj.toISOString()}, Day: ${scheduledDateTimeObj.getDay()} (0=Sun, 6=Sat), Is weekend/festival: ${isWeekendOrFestivalDate}`);

    // Automatically determine if surge should be applied based on admin settings
    // Surge is applied if:
    // 1. Admin has surge enabled
    // Note: Previously required weekend/festival, now applies whenever enabled
    const shouldApplySurge = surgeSettingsTyped.enabled;
    console.log(`[Surge Pricing] Surge enabled: ${surgeSettingsTyped.enabled}, Should apply surge: ${shouldApplySurge}, Multiplier: ${surgeSettingsTyped.multiplier}`);

    // Process stops (if provided)
    const stopsData = stops && Array.isArray(stops)
      ? stops.map((stop: any) => ({
        location: stop.location,
        latitude: parseFloat(stop.latitude),
        longitude: parseFloat(stop.longitude),
      }))
      : [];

    // Validate stops format
    for (const stop of stopsData) {
      if (!stop.location || !stop.latitude || !stop.longitude) {
        return res.status(400).json({ error: 'Each stop must have location, latitude, and longitude' });
      }
    }

    // Calculate distance if not provided
    let finalDistanceKm = distanceKm ? parseFloat(distanceKm) : null;
    if (!finalDistanceKm && pickupLatitude && pickupLongitude && dropLatitude && dropLongitude) {
      try {
        const distanceResult = await calculateDistance(
          { lat: parseFloat(pickupLatitude), lng: parseFloat(pickupLongitude) },
          { lat: parseFloat(dropLatitude), lng: parseFloat(dropLongitude) }
        );
        finalDistanceKm = distanceResult.distance;
        console.log(`Calculated distance: ${finalDistanceKm} km`);
      } catch (error: any) {
        console.error('Error calculating distance:', error);
        // Continue without distance if calculation fails (backward compatibility)
      }
    }

    // Use default rate if not provided (from admin settings or default 7 Rs/km)
    let finalPerKmRate = perKmRate
      ? parseFloat(perKmRate)
      : (surgeSettingsTyped.basePricePerKm || 7);

    // Apply surge multiplier to per_km_rate if surge is enabled (admin-controlled)
    // This increases the rate per km itself, not just the total fare
    const originalPerKmRate = finalPerKmRate;
    if (shouldApplySurge && surgeSettingsTyped?.multiplier && surgeSettingsTyped.multiplier > 1.0) {
      finalPerKmRate = finalPerKmRate * Number(surgeSettingsTyped.multiplier);
      console.log(`[Surge Pricing] ✅ APPLIED: ${surgeSettingsTyped.multiplier}x multiplier`);
      console.log(`[Surge Pricing] Rate per km: ${originalPerKmRate.toFixed(2)} → ${finalPerKmRate.toFixed(2)} Rs/km for ${scheduledDateTimeObj.toDateString()}`);
    } else {
      console.log(`[Surge Pricing] ❌ NOT APPLIED: shouldApplySurge=${shouldApplySurge}, multiplier=${surgeSettingsTyped?.multiplier}, originalRate=${originalPerKmRate.toFixed(2)}`);
    }

    // Calculate price_per_seat (what customer pays)
    // If pricePerSeat is provided, use it; otherwise calculate from distance and rate
    let finalPricePerSeat = 0;
    if (pricePerSeat && pricePerSeat > 0) {
      finalPricePerSeat = Math.round(parseFloat(pricePerSeat));
    } else if (finalDistanceKm && finalPerKmRate) {
      // Calculate from distance and rate
      const totalFare = finalDistanceKm * finalPerKmRate;
      finalPricePerSeat = Math.round(totalFare / Number(seatsAvailable));
    } else {
      return res.status(400).json({ error: 'Price per seat or distance/rate must be provided' });
    }

    // Driver receives 20 Rs less per seat (platform fee = 20 Rs per seat)
    // base_fare = what driver receives = (price_per_seat - 20) * seats
    const platformFeePerSeat = 10;
    const driverReceivesPerSeat = finalPricePerSeat
    const totalBaseFare = Math.round(driverReceivesPerSeat * Number(seatsAvailable)); // Total amount driver receives
    const totalPrice = (finalPricePerSeat * Number(seatsAvailable)) - platformFeePerSeat // Total amount customer pays
    const totalFare =totalBaseFare + (platformFeePerSeat * Number(seatsAvailable));

    // Create ride with stops stored in route_polyline or use JSON field if available
    // For minimal implementation, we'll store stops as JSON string in route_polyline
    // In production, you'd want a separate stops table
    const stopsJson = stopsData.length > 0 ? JSON.stringify(stopsData) : null;

    // Check if this is driver's first ride (before creating) for referral bonus
    const existingRidesCount = await prisma.ride.count({
      where: { driverId: driver.id },
    });
    const isFirstRide = existingRidesCount === 0;

    // Create ride
    const ride = await prisma.ride.create({
      data: {
        driverId: driver.id,
        vehicleId: activeVehicleId,
        start_location: pickupLocation,
        end_location: dropLocation,
        start_latitude: parseFloat(pickupLatitude),
        start_longitude: parseFloat(pickupLongitude),
        end_latitude: parseFloat(dropLatitude),
        end_longitude: parseFloat(dropLongitude),
        scheduled_time: scheduledDateTimeObj,
        seats_available: parseInt(seatsAvailable),
        base_fare: totalBaseFare, // Total amount driver receives = (price_per_seat - 20) * seats
        per_km_rate: finalPerKmRate,
        price_per_seat: finalPricePerSeat, // What customer pays per seat
        total_price: totalFare, // Total amount customer pays = price_per_seat * seats
        distance_km: finalDistanceKm,
        route_polyline: routePolyline, // Store stops JSON here (minimal implementation)
        is_surge: shouldApplySurge, // Automatically determined by admin settings and date/time
        surge_multiplier: shouldApplySurge ? Number(surgeSettingsTyped.multiplier) : 1.0,
        status: 'active',
        last_active_at: new Date(),
        start_city: startMeta.city,
        start_state: startMeta.state,
        end_city: endMeta.city,
        end_state: endMeta.state,
        route_buffer_km: routeBufferKm ? parseFloat(routeBufferKm) : null,
        route_distance_km: routeDistanceKm ? parseFloat(routeDistanceKm) : null,
        route_duration_min: routeDurationMin ? parseInt(routeDurationMin) : null,

      },
    });

    // Update driver's total_rides count
    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        total_rides: { increment: 1 },
      },
    });

    // Invalidate ride search cache
    await cacheService.deletePattern('ride:search:*');

    // Process referral bonus if this is driver's first ride post
    // Check if driver has a customer record (created during signup if referred)
    if (isFirstRide) {
      try {
        const driverCustomer = await prisma.customer.findUnique({
          where: { userId: driver.userId },
        });

        if (driverCustomer) {
          // Driver was referred, process bonus after first ride post
          const { processReferralBonus } = require('./referrals');
          await processReferralBonus(driverCustomer.id);
        }
      } catch (error) {
        console.error('Error processing referral bonus for driver:', error);
        // Don't fail the ride creation if referral bonus fails
      }
    }

    // Create admin notification for new ride
    try {
      const { createAdminNotification } = require('../services/notificationService');
      await createAdminNotification({
        type: 'ride',
        title: 'New Ride Published',
        message: `New ride published by ${driver.user.first_name} ${driver.user.last_name}`,
        relatedId: ride.id,
        metadata: {
          driverName: `${driver.user.first_name} ${driver.user.last_name}`,
          driverMobile: driver.user.mobile,
          startLocation: pickupLocation,
          endLocation: dropLocation,
          scheduledTime: scheduledDateTimeObj,
          seatsAvailable: parseInt(seatsAvailable),
        },
      });
    } catch (error) {
      console.error('Error creating admin notification for ride:', error);
      // Don't fail the ride creation if notification fails
    }

    res.json({
      ride,
      message: 'Ride published successfully',
    });
  } catch (error: any) {
    console.error('Publish ride error:', error);
    res.status(500).json({ error: error.message || 'Failed to publish ride' });
  }
});

// Helper function to parse time slots and create time range filters for Prisma
const parseTimeSlots = (timeSlots: string | string[] | (string | any)[] | undefined, searchDate: Date): any[] => {
  const slots = Array.isArray(timeSlots) ? timeSlots : timeSlots ? [timeSlots] : [];
  if (slots.length === 0) return [];

  const timeRanges: any[] = [];

  // Map of time slot IDs to hour ranges
  const slotMap: { [key: string]: { start: number; end: number } } = {
    '00-03': { start: 0, end: 3 },
    '03-06': { start: 3, end: 6 },
    '06-09': { start: 6, end: 9 },
    '09-12': { start: 9, end: 12 },
    '12-15': { start: 12, end: 15 },
    '15-18': { start: 15, end: 18 },
    '18-21': { start: 18, end: 21 },
    '21-24': { start: 21, end: 24 },
  };

  slots.forEach((slotId) => {
    const slot = slotMap[slotId];
    if (!slot) return;

    const startHour = slot.start;
    const endHour = slot.end;

    // Handle midnight-crossing slots (21-24 and 00-03)
    if (slotId === '21-24') {
      // 21:00 to 23:59:59 on the same day
      const startTime = new Date(searchDate);
      startTime.setHours(21, 0, 0, 0);
      const endTime = new Date(searchDate);
      endTime.setHours(23, 59, 59, 999);
      timeRanges.push({
        gte: startTime,
        lte: endTime,
      });
    } else if (slotId === '00-03') {
      // 00:00 to 02:59:59 on the same day
      const startTime = new Date(searchDate);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(searchDate);
      endTime.setHours(2, 59, 59, 999);
      timeRanges.push({
        gte: startTime,
        lte: endTime,
      });
    } else {
      // Regular slots within the same day
      // For slots like 03-06, we want 03:00:00 to 05:59:59
      const startTime = new Date(searchDate);
      startTime.setHours(startHour, 0, 0, 0);
      const endTime = new Date(searchDate);
      endTime.setHours(endHour, 0, 0, 0);
      // Subtract 1 second to make it exclusive of the end hour (06:00:00 becomes 05:59:59)
      endTime.setSeconds(endTime.getSeconds() - 1);
      timeRanges.push({
        gte: startTime,
        lte: endTime,
      });
    }
  });

  return timeRanges;
};

// // Get All Rides (Optimized search: pickup, drop, date + filters)
// router.get('/', async (req, res) => {
//   try {
//     const {
//       pickup,      // Pickup location search (string or LocationObject JSON)
//       drop,        // Drop location search (string or LocationObject JSON)
//       from,        // Pickup location object (alternative to pickup)
//       to,          // Drop location object (alternative to drop)
//       date,        // Date filter
//       timeSlots,   // Time slot filters (comma-separated or array: '00-03,06-09' or ['00-03', '06-09'])
//       minPrice,    // Price range: minimum
//       maxPrice,    // Price range: maximum
//       page = 1,
//       limit = 20,
//     } = req.query;

//     // console.log(`Ride search params - pickup: ${pickup}, drop: ${drop}, from: ${from}, to: ${to}, date: ${date}, timeSlots: ${timeSlots}, minPrice: ${minPrice}, maxPrice: ${maxPrice}, page: ${page}, limit: ${limit}`);
//     console.log("Ride search params - ", req.query);

//     // Parse location objects if provided (supports both query params and JSON strings)
//     let pickupLocation: LocationObject | string | null = null;
//     let dropLocation: LocationObject | string | null = null;

//     // Handle from/to (preferred format with location objects)
//     if (from) {
//       try {
//         pickupLocation = typeof from === 'string' ? JSON.parse(from) : from;
//       } catch (e) {
//         pickupLocation = from as string;
//       }
//     } else if (pickup) {
//       try {
//         pickupLocation = typeof pickup === 'string' ? JSON.parse(pickup) : pickup;
//       } catch (e) {
//         pickupLocation = pickup as string;
//       }
//     }

//     if (to) {
//       try {
//         dropLocation = typeof to === 'string' ? JSON.parse(to) : to;
//       } catch (e) {
//         dropLocation = to as string;
//       }
//     } else if (drop) {
//       try {
//         dropLocation = typeof drop === 'string' ? JSON.parse(drop) : drop;
//       } catch (e) {
//         dropLocation = drop as string;
//       }
//     }

//     // Validate locations (state restriction) - Backend validation for search requests
//     // When location objects with state are provided, validate that states are in allowed list
//     // This ensures backend validation enforces state restrictions (never trust frontend-only validation)
//     if (pickupLocation || dropLocation) {
//       const validation = validateSearchLocations(pickupLocation, dropLocation);
//       if (!validation.isValid) {
//         return res.status(400).json({
//           error: validation.error || 'Invalid location state',
//         });
//       }
//     }

//     // Extract location labels for database search (backward compatibility)
//     const pickupLabel = typeof pickupLocation === 'object' && pickupLocation ? pickupLocation.label : (pickupLocation || (pickup as string) || '');
//     const dropLabel = typeof dropLocation === 'object' && dropLocation ? dropLocation.label : (dropLocation || (drop as string) || '');

//     // Require both pickup and drop locations for search
//     // When start and end match, show the ride - both locations are required
//     if (!pickupLabel || !dropLabel) {
//       return res.status(400).json({
//         error: 'Both pickup and drop locations are required to search for rides',
//       });
//     }

//     const skip = (Number(page) - 1) * Number(limit);
//     const pageNum = Number(page);
//     const limitNum = Number(limit);

//     // Parse time slots if provided (can be comma-separated string or array)
//     const parsedTimeSlots: string[] = timeSlots
//       ? (typeof timeSlots === 'string' ? timeSlots.split(',') : Array.isArray(timeSlots) ? timeSlots.map(String) : [])
//       : [];

//     // Create cache key from search parameters
//     const cacheKey = cacheKeys.rideSearch({
//       startLocation: pickupLabel || '',
//       endLocation: dropLabel || '',
//       date: date as string || '',
//       timeSlots: parsedTimeSlots.length > 0 ? parsedTimeSlots.sort().join(',') : '',
//       minPrice: minPrice as string || '',
//       maxPrice: maxPrice as string || '',
//       page: page as string,
//       limit: limit as string,
//     });

//     // Try to get from cache
//     const cachedResult = await cacheService.get<{
//       rides: any[];
//       pagination: any;
//     }>(cacheKey);

//     if (cachedResult) {
//       return res.json(cachedResult);
//     }

//     // Build optimized WHERE clause
//     const where: any = {
//       status: 'active',
//     };

//     // Build location matching conditions
//     // Simple matching: Show rides only when BOTH start and end locations match
//     // User searches "Hyderabad to Choutupal" - only show rides "Hyderabad to Choutupal"

//     const locationConditions: any[] = [];

//     // Pickup location filter - match start_location
//     if (pickupLabel) {
//       const pickupParts = extractLocationParts(pickupLabel);
//       if (pickupParts.length > 0) {
//         const pickupOrConditions: any[] = [{
//           start_location: { contains: pickupLabel },
//         }];
//         pickupParts.forEach(part => {
//           if (part !== pickupLabel) {
//             pickupOrConditions.push({
//               start_location: { contains: part },
//             });
//           }
//         });
//         locationConditions.push({ OR: pickupOrConditions });
//       } else {
//         locationConditions.push({
//           start_location: { contains: pickupLabel },
//         });
//       }
//     }

//     // Drop location filter - match end_location (REQUIRED if pickup is provided)
//     // Both start and end must match for a ride to be shown
//     if (dropLabel) {
//       const dropParts = extractLocationParts(dropLabel);
//       if (dropParts.length > 0) {
//         const dropOrConditions: any[] = [{
//           end_location: { contains: dropLabel },
//         }];
//         dropParts.forEach(part => {
//           if (part !== dropLabel) {
//             dropOrConditions.push({
//               end_location: { contains: part },
//             });
//           }
//         });
//         locationConditions.push({ OR: dropOrConditions });
//       } else {
//         locationConditions.push({
//           end_location: { contains: dropLabel },
//         });
//       }
//     }

//     // Combine location conditions - BOTH pickup and drop must match
//     if (locationConditions.length > 0) {
//       if (locationConditions.length === 1) {
//         Object.assign(where, locationConditions[0]);
//       } else {
//         // Multiple conditions - use AND (both must match)
//         where.AND = locationConditions;
//       }
//     }

// Date and time slot filter (optimized with index on scheduled_time)
// if (date) {
//   const searchDate = new Date(date as string);
//   searchDate.setHours(0, 0, 0, 0); // Start of day

//   if (parsedTimeSlots.length > 0) {
//     // Filter by specific time slots
//     const timeRanges = parseTimeSlots(parsedTimeSlots, searchDate);
//     if (timeRanges.length > 0) {
//       // Use OR condition for multiple time slots
//       if (timeRanges.length === 1) {
//         // Single time slot - set directly
//         where.scheduled_time = timeRanges[0];
//       } else {
//         // Multiple time slots - need to combine with other filters using AND
//         // If where already has AND, add to it; otherwise create new AND
//         const timeSlotCondition = {
//           OR: timeRanges.map((range) => ({
//             scheduled_time: range,
//           })),
//         };

//         if (where.AND) {
//           where.AND.push(timeSlotCondition);
//         } else {
//           // Convert existing conditions to AND structure
//           const existingConditions: any = { ...where };
//           delete existingConditions.AND;
//           where.AND = [existingConditions, timeSlotCondition];
//         }
//       }
//     }
//   } else {
//     // No time slots specified, filter by entire day
//     const startOfDay = new Date(searchDate);
//     startOfDay.setHours(0, 0, 0, 0);
//     const endOfDay = new Date(searchDate);
//     endOfDay.setHours(23, 59, 59, 999);

//     if (where.AND) {
//       where.AND.push({
//         scheduled_time: {
//           gte: startOfDay,
//           lte: endOfDay,
//         },
//       });
//     } else {
//       where.scheduled_time = {
//         gte: startOfDay,
//         lte: endOfDay,
//       };
//     }
//   }
// }

//     // Price range filter (filter by price_per_seat - what users pay)
//     if (minPrice || maxPrice) {
//       where.price_per_seat = {};
//       if (minPrice) {
//         where.price_per_seat.gte = parseFloat(minPrice as string);
//       }
//       if (maxPrice) {
//         where.price_per_seat.lte = parseFloat(maxPrice as string);
//       }
//     }


//     // Create a where clause for count (copy entire where structure)
//     // Since we removed mode option, we can copy the entire where structure
//     const countWhere = JSON.parse(JSON.stringify(where));

//     // const rideQuery = prisma.ride.findMany;
//     // console.log()

//     // console.log('Ride search WHERE clause:', JSON.stringify(where));

//     // Optimized query: Use include for relations, select for specific fields
//     const [rides, total] = await Promise.all([
//       prisma.ride.findMany({
//         where,
//         skip,
//         take: limitNum,
//         include: {
//           driver: {
//             include: {
//               user: {
//                 select: {
//                   first_name: true,
//                   last_name: true,
//                   mobile: true,
//                   profile_photo_url: true,
//                 },
//               },
//             },
//           },
//           bookings: {
//             where: {
//               status: { in: ['confirmed', 'started'] },
//             },
//             select: {
//               id: true,
//               passengerCount: true,
//               pickup_latitude: true,
//               pickup_longitude: true,
//               drop_latitude: true,
//               drop_longitude: true,
//             },
//           },
//         },
//         orderBy: [
//           { scheduled_time: 'asc' }, // Primary sort by time (uses index)
//           { price_per_seat: 'asc' }, // Secondary sort by price (price_per_seat)
//         ],
//       }),
//       prisma.ride.count({ where: countWhere }),
//     ]);

//     // Calculate available seats - simple calculation (no segment overlap logic)
//     // Since we only show rides where start and end match exactly, we can use simple seat count
//     const ridesWithAvailability = rides.map((ride) => {
//       // Simple calculation: available seats = total seats - booked seats
//       const availableSeats = Math.max(0, ride.seats_available - ride.seats_booked);

//       // Parse stops from route_polyline if it's JSON
//       let stops = null;
//       if (ride.route_polyline) {
//         try {
//           const parsed = JSON.parse(ride.route_polyline);
//           if (Array.isArray(parsed) && parsed.length > 0) {
//             stops = parsed;
//           }
//         } catch (e) {
//           // If not JSON, it's a polyline string - ignore
//         }
//       }

//       return {
//         ...ride,
//         availableSeats,
//         seatsBooked: ride.seats_booked,
//         stops, // Include stops if available
//         pickupLocation: ride.start_location,
//         dropLocation: ride.end_location,
//         // Show price_per_seat to users (what they pay)
//         price_per_seat: ride.price_per_seat ? Number(ride.price_per_seat) : 0,
//       };
//     });

//     // Filter out rides with no available seats
//     const ridesWithSeatsAvailable = ridesWithAvailability.filter((ride) => ride.availableSeats > 0);

//     const result = {
//       rides: ridesWithSeatsAvailable,
//       pagination: {
//         page: pageNum,
//         limit: limitNum,
//         total,
//         totalPages: Math.ceil(total / limitNum),
//       },
//     };

//     // Cache the result
//     await cacheService.set(cacheKey, result, cacheTTL.rideSearch);

//     res.json(result);
//   } catch (error: any) {
//     console.error('Get rides error:', error);
//     res.status(500).json({ error: error.message || 'Failed to get rides' });
//   }
// });

//Get All Rides (Optimized search: pickup, drop, date + filters)
router.get('/', async (req, res) => {
  console.log("Ride search params - ", req.query);
  try {
    const {
      pickup,      // Pickup location search (string or LocationObject JSON)
      drop,        // Drop location search (string or LocationObject JSON)
      from,        // Pickup location object (alternative to pickup)
      to,          // Drop location object (alternative to drop)
      date,        // Date filter
      timeSlots,   // Time slot filters (comma-separated or array: '00-03,06-09' or ['00-03', '06-09'])
      minPrice,    // Price range: minimum
      maxPrice,    // Price range: maximum
      page = 1,
      limit = 20,
      startLatitude,
      startLongitude,
      endLatitude,
      endLongitude,
      minSeats,
    } = req.query;

    if (
      !startLatitude ||
      !startLongitude ||
      !endLatitude ||
      !endLongitude
    ) {
      return res.status(400).json({
        message: "Pickup and drop coordinates are required",
      });
    }

    if (!pickup || !drop) {
      return res.status(400).json({
        error: 'Both pickup and drop locations are required to search for rides',
      });
    }

    console.log("Ride search params - ", req.query);

    // 🔹 1. Get city & state from lat/lng
    const pickupMeta = await getCityAndState(startLatitude, startLongitude);
    const dropMeta = await getCityAndState(endLatitude, endLongitude);

    // console.log(pickupMeta, dropMeta);

    // ✅ STRICT STATE VALIDATION - Both states must be active in service_states table
    if (!pickupMeta.state || !dropMeta.state) {
      return res.status(400).json({ error: 'Services are not available for the location you are searching.' });
    }


    const pickupStateValidation = await validateState(pickupMeta.state);
    if (!pickupStateValidation.isValid) {
      return res.status(400).json({ error: pickupStateValidation.error });
    }

    const dropStateValidation = await validateState(dropMeta.state);
    if (!dropStateValidation.isValid) {
      return res.status(400).json({ error: dropStateValidation.error });
    }

    const pickupPoint = {
      lat: Number(startLatitude),
      lng: Number(startLongitude),
    };

    const dropPoint = {
      lat: Number(endLatitude),
      lng: Number(endLongitude),
    };

    const whereClause: any = {
      status: "active",
       //to hide pastrides
      scheduled_time: {      
        gte: new Date(),
      },                    //Ak
    };

    // if (pickupMeta.state) {
    //   whereClause.start_state = pickupMeta.state;
    // }

    // if (dropMeta.state) {
    //   whereClause.end_state = dropMeta.state;
    // }

    //     if (date) {
    //   // Create local day boundaries
    //   const startLocal = new Date(`${date}T00:00:00`);
    //   const endLocal = new Date(`${date}T23:59:59`);

    //   // 🔥 Add +5:30 so Prisma's UTC conversion cancels it
    //   const startOfDay = addISTOffset(startLocal);
    //   const endOfDay = addISTOffset(endLocal);

    //   // console.log(
    //   //   `Filtering rides for date: ${date},
    //   //    Start (IST-adjusted): ${startOfDay.toISOString()},
    //   //    End (IST-adjusted): ${endOfDay.toISOString()}`
    //   // );

    //   whereClause.scheduled_time = {
    //     gte: startOfDay,
    //     lte: endOfDay,
    //   };
    // }

    if (date) {
      const startLocal = new Date(`${date}T00:00:00`);
      const endLocal = new Date(`${date}T23:59:59`);

      const startOfDay = addISTOffset(startLocal);
      const endOfDay = addISTOffset(endLocal);

      const timeSlotConditions = buildTimeSlotRanges(date, timeSlots);

      whereClause.AND = [
        {
          scheduled_time: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        ...(timeSlotConditions.length
          ? [{ OR: timeSlotConditions }]
          : []),
      ];
    }

    // if (minSeats) {
    //   whereClause.seats_available = {
    //     gte: Number(minSeats),
    //   };
    // }

    // 🔹 Price filter
    if (minPrice || maxPrice) {
      whereClause.price_per_seat = {};
      if (minPrice) whereClause.price_per_seat.gte = Number(minPrice);
      if (maxPrice) whereClause.price_per_seat.lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const pageNum = Number(page);
    const limitNum = Number(limit);

    const parsedTimeSlots: string[] = timeSlots
      ? (typeof timeSlots === 'string' ? timeSlots.split(',') : Array.isArray(timeSlots) ? timeSlots.map(String) : [])
      : [];

    // Create cache key from search parameters
    // const cacheKey = cacheKeys.rideSearch({
    //   startLocation: pickup || '',
    //   endLocation: drop || '',
    //   date: date as string || '',
    //   timeSlots: parsedTimeSlots.length > 0 ? parsedTimeSlots.sort().join(',') : '',
    //   minPrice: minPrice as string || '',
    //   maxPrice: maxPrice as string || '',
    //   page: page as string,
    //   limit: limit as string,
    // });

    // // Try to get from cache
    // const cachedResult = await cacheService.get<{
    //   rides: any[];
    //   pagination: any;
    // }>(cacheKey);

    // console.log('Cache result for ride search:', cachedResult);

    // if (cachedResult) {
    //   return res.json(cachedResult);
    // }

    console.log('Ride search WHERE clause:', JSON.stringify(whereClause));

    const rides = await prisma.ride.findMany({
      where: whereClause,
      include: {
        driver: {
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                mobile: true,
                profile_photo_url: true,
              },
            },
          },
        },
        bookings: {
          where: {
            status: { in: ['confirmed', 'started'] },
          },
          select: {
            id: true,
            passengerCount: true,
            pickup_latitude: true,
            pickup_longitude: true,
            drop_latitude: true,
            drop_longitude: true,
          },
        },
      },
      orderBy: [
        { scheduled_time: "asc" },
        { price_per_seat: "asc" }
      ],
    });

    // console.log(`rides found after initial filters`, rides);

    // 🔹 4. Polyline + buffer filtering
    let matchedRides = rides.filter((ride) => {
      if (!ride.route_polyline) return false;

      const routePoints = decodePolyline(ride.route_polyline);
      const bufferKm = Number(30);

      const pickupIndex = findNearestIndexOnRoute(
        pickupPoint,
        routePoints,
        bufferKm
      );

      if (pickupIndex === -1) return false;

      const dropIndex = findNearestIndexOnRoute(
        dropPoint,
        routePoints,
        bufferKm
      );

      if (dropIndex === -1) return false;

      // pickup must come before drop
      if (pickupIndex >= dropIndex) return false;

      // seats available
      return ride.seats_available - ride.seats_booked > 0;
    });

    console.log(`rides found after polyline filtering: ${JSON.stringify(matchedRides)}`);

    //filters by avilable seats
    if (minSeats) {
      matchedRides = matchedRides.filter(ride => (ride.seats_available - ride.seats_booked) >= Number(minSeats));
    }

    // console.log(`rides found after polyline filtering: ${JSON.stringify(matchedRides)}`);
    const total = matchedRides.length;

    // Pagination
    const paginatedRides = matchedRides.slice(skip, skip + limitNum);

    const result = {
      rides: paginatedRides,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };

    // Cache the result
    // await cacheService.set(cacheKey, result, cacheTTL.rideSearch);

    res.json(result);
  } catch (error: any) {
    console.error('Get rides error:', error);
    res.status(500).json({ error: error.message || 'Failed to get rides' });
  }
});

// Get Single Ride Details
router.get('/:id', async (req, res) => {
  try {
    const rideId = req.params.id;
    const cacheKey = cacheKeys.rideDetails(rideId);

    // Try to get from cache
    const cachedRide = await cacheService.get(cacheKey);
    if (cachedRide) {
      return res.json({ ride: cachedRide });
    }

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        driver: {
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                mobile: true,
                profile_photo_url: true,
              },
            },
            vehicles: true,
          },
        },
        bookings: {
          where: {
            status: { in: ['confirmed', 'started', 'completed'] },
          },
          include: {
            customer: {
              include: {
                user: {
                  select: {
                    first_name: true,
                    last_name: true,
                    mobile: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    const availableSeats = ride.seats_available - ride.seats_booked;

    const rideWithAvailability = {
      ...ride,
      availableSeats,
      seatsBooked: ride.seats_booked,
    };

    // Cache the result
    await cacheService.set(cacheKey, rideWithAvailability, cacheTTL.rideDetails);

    res.json({
      ride: rideWithAvailability,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get ride' });
  }
});

// Get Driver's Rides
router.get('/driver/my-rides', authenticate, authorize('driver'), async (req: AuthRequest, res) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    //  Auto-update past rides to EXPIRED 
    const now = new Date();
    await prisma.ride.updateMany({
      where: {
        driverId: driver.id,
        status: 'active',
        scheduled_time: {
          lt: now, // Past rides
        },
                seats_booked: 0, // Only rides with no bookings
      },
      data: {
        status: 'expired', // Mark as expired
      },
    });

    const rides = await prisma.ride.findMany({
      where: { driverId: driver.id },
      include: {
        bookings: {
          where: {
            // status: { in: ['confirmed', 'started', 'completed'] },
       // Include confirmed, started, and completed bookings
            status: { in: ['pending','confirmed', 'started', 'completed'] }, 

          },
          include: {
            customer: {
              include: {
                user: {
                  select: {
                    first_name: true,
                    last_name: true,
                    mobile: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        scheduled_time: 'desc',
      },
    });

    // Add availableSeats and seatsBooked to each ride using seats_booked field
    const ridesWithAvailability = rides.map((ride) => ({
      ...ride,
      availableSeats: ride.seats_available - ride.seats_booked,
      seatsBooked: ride.seats_booked,
    }));

    res.json({ rides: ridesWithAvailability });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get rides' });
  }
});

// Start Ride
router.post('/:id/start', authenticate, authorize('driver'), async (req: AuthRequest, res) => {
  try {
    const rideId = req.params.id;

    const driver = await prisma.driver.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        bookings: {
          where: {
            status: { in: ['confirmed'] },
            paymentStatus: 'success',
          },
        },
      },
    });

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (ride.driverId !== driver.id) {
      return res.status(403).json({ error: 'Not authorized to start this ride' });
    }
    // Check if driver has any other started ride
    const activeRide = await prisma.ride.findFirst({
      where: {
        driverId: driver.id,
        status: 'started',
        NOT: {
          id: rideId
        }
      }
    });

    if (activeRide) {
      return res.status(400).json({ error: 'You are not allowed to start two rides at same time' });
    }

    if (ride.status === 'started') {
      return res.status(400).json({ error: 'Ride is already started' });
    }

    if (ride.status !== 'active') {
      return res.status(400).json({ error: 'Only active rides can be started' });
    }

    if (ride.bookings.length === 0) {
      return res.status(400).json({ error: 'Cannot start ride without confirmed bookings' });
    }

    // Update ride status to started
    await prisma.ride.update({
      where: { id: rideId },
      data: {
        status: 'started',
        started_at: new Date(),
        last_active_at: new Date(),
      },
    });

    // Update all confirmed bookings to started//
    // await prisma.booking.updateMany({
    //   where: {
    //     rideId: rideId,
    //     status: 'confirmed'
    //   },
    //   data: {
    //     status: 'started'
    //   }
    // });

    res.json({ message: 'Ride started successfully', rideId });
  } catch (error: any) {
    console.error('Start ride error:', error);
    res.status(500).json({ error: error.message || 'Failed to start ride' });
  }
});

// End Ride (Complete ride when all drop PINs are verified)
router.post('/:id/end', authenticate, authorize('driver'), async (req: AuthRequest, res) => {
  try {
    const rideId = req.params.id;

    const driver = await prisma.driver.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        bookings: {
          where: {
            paymentStatus: 'success',
          },
        },
      },
    });

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (ride.driverId !== driver.id) {
      return res.status(403).json({ error: 'Not authorized to end this ride' });
    }

    if (ride.status !== 'started') {
      return res.status(400).json({ error: 'Only started rides can be ended' });
    }

    // Get only bookings that are in 'started' status (have been picked up)
    const startedBookings = ride.bookings.filter((b) => b.status === 'started');

    if (startedBookings.length === 0) {
      return res.status(400).json({ error: 'No started bookings found for this ride' });
    }

    // Check if all started bookings have drop PIN verified
    const allDropVerified = startedBookings.every((booking) => booking.drop_verified === true);

    if (!allDropVerified) {
      return res.status(400).json({
        error: 'Cannot end ride. All started bookings must have drop PIN verified first.',
        verifiedCount: startedBookings.filter((b) => b.drop_verified).length,
        totalCount: startedBookings.length,
      });
    }

    // Update all started bookings to completed status
    // await prisma.booking.updateMany({
    //   where: {
    //     rideId: ride.id,
    //     status: 'started',
    //   },
    //   data: {
    //     status: 'completed',
    //   },
    // });

    // Update ride status to completed
    await prisma.ride.update({
      where: { id: rideId },
      data: {
        status: 'completed',
        completed_at: new Date(),
        last_active_at: new Date(),
      },
    });

    res.json({
      message: 'Ride completed successfully',
      rideId,
      completedBookings: startedBookings.length,
    });
  } catch (error: any) {
    console.error('End ride error:', error);
    res.status(500).json({ error: error.message || 'Failed to end ride' });
  }
});

// Cancel Ride
router.delete('/:id', authenticate, authorize('driver'), async (req: AuthRequest, res) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const ride = await prisma.ride.findUnique({
      where: { id: req.params.id },
    });

    console.log(ride)

    if (!ride || ride.driverId !== driver.id) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Get all bookings for this ride
    const bookings = await prisma.booking.findMany({
      where: {
        rideId: ride.id,
        status: { in: ['pending', 'confirmed', 'started'] },
      },
      include: {
        customer: true,
      },
    });

    // Cancel all bookings and process refunds
    await prisma.$transaction(async (tx) => {
      // Track total driver deduction for confirmed bookings
      let totalDriverDeduction = 0;

      for (const booking of bookings) {
        // Check if booking was confirmed (before updating status)
        const wasConfirmed = booking.status === 'confirmed' && booking.paymentStatus === 'success';

        // Update booking status
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: 'cancelled',
            paymentStatus: booking.paymentStatus === 'success' ? 'refund_initiated' : booking.paymentStatus,
            cancelledBy: 'driver',

          },
        });

        // Release seats
        await tx.ride.update({
          where: { id: ride.id },
          data: {
            seats_booked: { decrement: booking.passengerCount },
          },
        });

        // Process refunds if payment was successful
        if (booking.paymentStatus === 'success') {
          const paymentMethod = booking.paymentMethod?.toLowerCase() || 'razorpay';

          if (paymentMethod === 'wallet') {
            // Refund to wallet
            await tx.customer.update({
              where: { id: booking.customerId },
              data: {
                wallet_balance: { increment: Number(booking.base_fare) },
              },
            });

            await tx.walletTransaction.create({
              data: {
                customerId: booking.customerId,
                amount: Number(booking.base_fare),
                type: 'credit',
                transaction_type: 'refund',
                description: `Refund for cancelled ride - booking ${booking.booking_number}`,
                bookingId: booking.id,
              },
            });

            await tx.driverWalletTransaction.create({
              data: {
                driverId: driver.id,
                amount: Number(booking.base_fare),
                type: 'debit',
                transaction_type: 'refund',
                description: `Driver wallet debit for refund - cancelled booking ${booking.booking_number}`,
                bookingId: booking.id,
              },
            });

            // await tx.driver.update({
            //   where: { id: driver.id },
            //   data: {
            //     wallet_balance: { decrement: Number(booking.base_fare) },
            //     total_earnings: { decrement: Number(booking.base_fare) },
            //   }
            // });

            await tx.adminWalletTransaction.create({
              data:{
                adminId:config.adminId,
                amount: Number(booking.base_fare),
                type:"debit",
                transaction_type:"refund_adjustment",
                description:`Refund for cancelled booking ${booking.booking_number}`,
                bookingId:booking.id,
                driverId:driver.id,
                customerId:booking.customerId
              }
            })

            await tx.admin.update({
            where: { id: config.adminId },
            data: {
              wallet_balance: { decrement: booking.base_fare },
            },
          });


          } else if (paymentMethod === 'razorpay' && booking.utr_number) {
            // Razorpay refund will be processed after transaction
            // Mark for refund processing
          }

          // For confirmed bookings, track base_fare for driver  deduction
          // Only confirmed bookings should have the amount deducted
          // if (wasConfirmed) {
          //   const baseFare = Number(booking.base_fare);
          //   totalDriverDeduction += baseFare;

          //   // Create wallet transaction record for driver deduction
          //   // Note: WalletTransaction uses customerId, so we use booking's customerId with description indicating driver deduction
          //   // await tx.driverWalletTransaction.create({
          //   //   data: {
          //   //     driverId: driver.id,
          //   //     amount: baseFare,
          //   //     type: 'debit',
          //   //     transaction_type: 'refund',
          //   //     description: `Driver wallet deduction (₹${baseFare}) for cancelled ride - booking ${booking.booking_number}`,
          //   //     bookingId: booking.id,
          //   //   },
          //   // });


          // }

          // Decrement customer booking count
          await tx.customer.update({
            where: { id: booking.customerId },
            data: {
              total_bookings: { decrement: 1 },
              cancelled_bookings: { increment: 1 },
            },
          });
        }
      }

      // Deduct from driver wallet (only for confirmed bookings)
      // if (totalDriverDeduction > 0) {
      //   // Get current driver wallet balance
      //   const adminWithBalance = await tx.admin.findUnique({
      //     where: { id: config.adminId },
      //     select: { wallet_balance: true },
      //   });

      //   if (adminWithBalance) {
      //     const currentBalance = Number(adminWithBalance.wallet_balance) || 0;

      //     // Ensure driver has enough balance (should always be true if bookings were confirmed)
      //     if (currentBalance >= totalDriverDeduction) {
      //       await tx.admin.update({
      //         where: { id: config.adminId },
      //         data: {
      //           wallet_balance: { decrement: totalDriverDeduction },
      //         },
      //       });
      //     } else {
      //       console.warn(`[Ride Cancellation] Admin ${config.adminId} has insufficient balance. Current: ₹${currentBalance}, Required: ₹${totalDriverDeduction}`);
      //       // Still deduct what's available (or handle as error)
      //       // await tx.driver.update({
      //       //   where: { id: driver.id },
      //       //   data: {
      //       //     wallet_balance: 0,
      //       //     total_earnings: { decrement: currentBalance },
      //       //   },
      //       // });
      //       // return res.json({message:"insufficient balance"})
      //     }
      //   }
      // }

      // Update ride status
      await tx.ride.update({
        where: { id: ride.id },
        data: { status: 'cancelled' },
      });
    }, { timeout: 60000 });

    // Process Razorpay refunds after transaction
    for (const booking of bookings) {
      if (booking.paymentStatus === 'success' && booking.paymentMethod?.toLowerCase() === 'razorpay' && booking.utr_number) {
        try {
          const { refundRazorpayPayment } = await import('../services/razorpayService');
          await refundRazorpayPayment(booking.utr_number, Number(booking.base_fare), {
            bookingId: booking.id,
            bookingNumber: booking.booking_number,
            reason: 'Ride cancelled by driver',
          });

          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              paymentStatus: 'refund_initiated',
            },
          });

            await prisma.adminWalletTransaction.create({
              data:{
                adminId:config.adminId,
                amount: Number(booking.base_fare),
                type:"debit",
                transaction_type:"refund_adjustment",
                description:`Refund for cancelled booking ${booking.booking_number}`,
                bookingId:booking.id,
                driverId:driver.id,
                customerId:booking.customerId
              }
            })

            await prisma.admin.update({
            where: { id: config.adminId },
            data: {
              wallet_balance: { decrement: booking.base_fare },
            },
          });

          await prisma.walletTransaction.create({
              data: {
                customerId: booking.customerId,
                amount: Number(booking.base_fare),
                type: 'credit',
                transaction_type: 'refund',
                description: `Refund for cancelled ride - booking ${booking.booking_number}`,
                bookingId: booking.id,
              },
            });

          await prisma.driverWalletTransaction.create({
              data: {
                driverId: driver.id,
                amount: Number(booking.base_fare),
                type: 'debit',
                transaction_type: 'refund',
                description: `Driver wallet debit for refund - cancelled booking ${booking.booking_number}`,
                bookingId: booking.id,
              },
            });

        } catch (refundError: any) {
          console.error(`[Ride Cancellation] Failed to refund booking ${booking.booking_number}:`, refundError);
          // Don't fail the cancellation - refund can be processed manually
        }
      }
    }

    res.json({
      message: 'Ride cancelled successfully',
      cancelledBookings: bookings.length,
      refundsProcessed: bookings.filter(b => b.paymentStatus === 'success').length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to cancel ride' });
  }
});

//get started ride
router.get('/startedRideForCustomer/:id', authenticate, authorize("customer"), async (req: AuthRequest, res) => {
  try {
    // console.log("getting started ride for customer", req.user!.userId);

    const id = req.params.id;

    const startedride = await prisma.booking.findMany({
      where: {
        customerId: id,
        status: 'started'
      }
    })

    if (!startedride) {
      return res.json({ error: "started ride not found" })
    }

    res.json({ startedride })

  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get Stated ride' })
  }
})

router.get('/get-started-ride-for-driver/:id', authenticate, authorize("driver"), async (req: AuthRequest, res) => {
  try {
    const startedride = await prisma.ride.findMany({
      where: {
        driverId: req.params.id,
        status: 'started'
      }
    })

    if (!startedride) {
      return res.json({ error: "started ride not found" })
    }

    res.json({
      startedride
    })

  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get Stated ride' })
  }
})

//post driver cancel message
router.post("/driver-ride-cancel/:id", authenticate, authorize("driver"), async (req: AuthRequest, res) => {
  try {
    const rideId = req.params.id;
    const { message } = req.body

    //post message to prisma ride schema message field
    const ride = await prisma.ride.update({
      where: { id: rideId },
      data: { message: message }
    })

    return res.status(200).json({ message: "Successfully message posted", ride })

  } catch (err: any) {
    return res.json({ error: err.message })
  }
});

export default router;

