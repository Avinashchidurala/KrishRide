/**
 * Calculate distance between two coordinates using Google Maps Distance Matrix API
 */

import axios from 'axios';
import { config } from '../config/environment';

export interface DistanceResult {
  distance: number; // in kilometers
  duration: number; // in minutes
}

/**
 * Calculate distance using Google Maps Distance Matrix API
 */
export const calculateDistance = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<DistanceResult> => {
  if (!config.googleMapsApiKey) {
    throw new Error('Google Maps API key is not configured');
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: `${origin.lat},${origin.lng}`,
        destinations: `${destination.lat},${destination.lng}`,
        mode: 'driving',
        units: 'metric',
        key: config.googleMapsApiKey,
      },
    });

    if (response.data.status === 'OK' && response.data.rows[0]?.elements[0]?.status === 'OK') {
      const element = response.data.rows[0].elements[0];
      const distanceKm = element.distance.value / 1000; // Convert meters to kilometers
      const durationMinutes = element.duration.value / 60; // Convert seconds to minutes

      return {
        distance: Math.round(distanceKm * 100) / 100, // Round to 2 decimal places
        duration: Math.round(durationMinutes),
      };
    } else {
      throw new Error(`Distance Matrix API error: ${response.data.status}`);
    }
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Google Maps API error: ${error.response.data?.error_message || error.message}`);
    }
    throw new Error(`Failed to calculate distance: ${error.message}`);
  }
};

