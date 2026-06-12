package com.hushryd.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.dto.RideRequests;
import com.hushryd.backend.entity.Driver;
import com.hushryd.backend.entity.Ride;
import com.hushryd.backend.entity.ServiceState;
import com.hushryd.backend.entity.Vehicle;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.repository.DriverRepository;
import com.hushryd.backend.repository.RideRepository;
import com.hushryd.backend.repository.ServiceStateRepository;
import com.hushryd.backend.repository.VehicleRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class RideService {

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private ServiceStateRepository serviceStateRepository;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${google.maps.api-key:AIzaSyAzKj6mJJYVAZ233kMUzTPOO3cuhBSfSvo}")
    private String googleMapsApiKey;

    @Transactional
    public Ride publishRide(String userId, RideRequests.PublishRideRequest request) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "Driver profile not found"));

        if (!"approved".equals(driver.getKycStatus())) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "KYC must be approved before publishing rides");
        }

        if (request.getPickupLocation() == null || request.getDropLocation() == null) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Pickup and drop locations are required");
        }

        if (request.getPickupLatitude() == null || request.getPickupLongitude() == null ||
            request.getDropLatitude() == null || request.getDropLongitude() == null) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Pickup and drop coordinates are required");
        }

        double startLat = Double.parseDouble(request.getPickupLatitude());
        double startLng = Double.parseDouble(request.getPickupLongitude());
        double endLat = Double.parseDouble(request.getDropLatitude());
        double endLng = Double.parseDouble(request.getDropLongitude());

        Map<String, String> startMeta = getCityAndState(startLat, startLng);
        Map<String, String> endMeta = getCityAndState(endLat, endLng);

        String startState = startMeta.get("state");
        String endState = endMeta.get("state");

        if (startState == null || endState == null) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Services are not available for the location you are searching.");
        }

        validateState(startState);
        validateState(endState);

        LocalDateTime scheduledDateTimeObj;
        if (request.getScheduledDateTime() != null) {
            scheduledDateTimeObj = LocalDateTime.parse(request.getScheduledDateTime().substring(0, 19));
        } else if (request.getScheduledDate() != null && request.getScheduledTime() != null) {
            scheduledDateTimeObj = LocalDateTime.parse(request.getScheduledDate() + "T" + request.getScheduledTime() + ":00");
        } else {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Scheduled date and time are required");
        }

        if (scheduledDateTimeObj.isBefore(LocalDateTime.now())) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Scheduled time must be in the future");
        }

        if (request.getSeatsAvailable() == null || request.getSeatsAvailable() < 1) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "At least 1 seat is required");
        }

        if (request.getPricePerSeat() == null || request.getPricePerSeat() <= 0) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Price per seat must be greater than 0");
        }

        // Validate vehicle
        String activeVehicleId = request.getVehicleId();
        if (activeVehicleId == null) {
            List<Vehicle> vehicles = vehicleRepository.findByDriverIdAndIsActive(driver.getId(), true);
            if (!vehicles.isEmpty()) {
                activeVehicleId = vehicles.get(0).getId();
            }
        }

        if (activeVehicleId == null) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "No active vehicle found. Please activate a vehicle first.");
        }

        Optional<Vehicle> vehicleOpt = vehicleRepository.findByIdAndDriverId(activeVehicleId, driver.getId());
        if (vehicleOpt.isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Vehicle not found or not active");
        }

        // Get surge pricing settings from Redis or fallback
        double surgeMultiplier = 1.0;
        boolean isSurge = false;
        double basePricePerKm = request.getPerKmRate() != null ? request.getPerKmRate() : 7.0;

        String city = startMeta.get("city");
        Map<?, ?> surgeSettings = getSurgeSettings(city);
        if (surgeSettings != null) {
            Boolean enabled = (Boolean) surgeSettings.get("enabled");
            if (enabled != null && enabled) {
                isSurge = true;
                Object mult = surgeSettings.get("multiplier");
                if (mult instanceof Number) {
                    surgeMultiplier = ((Number) mult).doubleValue();
                }
                Object base = surgeSettings.get("basePricePerKm");
                if (base instanceof Number) {
                    basePricePerKm = ((Number) base).doubleValue();
                }
            }
        }

        double finalPerKmRate = basePricePerKm;
        if (isSurge) {
            finalPerKmRate = basePricePerKm * surgeMultiplier;
        }

        double finalDistanceKm = request.getDistanceKm() != null ? request.getDistanceKm() : 0.0;
        double finalPricePerSeat = request.getPricePerSeat();

        double platformFeePerSeat = 10.0;
        double totalBaseFare = finalPricePerSeat * request.getSeatsAvailable();
        double totalFare = totalBaseFare + (platformFeePerSeat * request.getSeatsAvailable());

        Ride ride = Ride.builder()
                .driver(driver)
                .vehicleId(activeVehicleId)
                .startLocation(request.getPickupLocation())
                .endLocation(request.getDropLocation())
                .startLatitude(BigDecimal.valueOf(startLat))
                .startLongitude(BigDecimal.valueOf(startLng))
                .endLatitude(BigDecimal.valueOf(endLat))
                .endLongitude(BigDecimal.valueOf(endLng))
                .scheduledTime(scheduledDateTimeObj)
                .seatsAvailable(request.getSeatsAvailable())
                .seatsBooked(0)
                .baseFare(BigDecimal.valueOf(totalBaseFare))
                .perKmRate(BigDecimal.valueOf(finalPerKmRate))
                .pricePerSeat(BigDecimal.valueOf(finalPricePerSeat))
                .totalPrice(BigDecimal.valueOf(totalFare))
                .distanceKm(BigDecimal.valueOf(finalDistanceKm))
                .routePolyline(request.getRoutePolyline())
                .isSurge(isSurge)
                .surgeMultiplier(BigDecimal.valueOf(surgeMultiplier))
                .status("active")
                .lastActiveAt(LocalDateTime.now())
                .startCity(startMeta.get("city"))
                .startState(startState)
                .endCity(endMeta.get("city"))
                .endState(endState)
                .routeBufferKm(request.getRouteBufferKm() != null ? BigDecimal.valueOf(request.getRouteBufferKm()) : BigDecimal.valueOf(5.0))
                .routeDistanceKm(request.getRouteDistanceKm() != null ? BigDecimal.valueOf(request.getRouteDistanceKm()) : null)
                .routeDurationMin(request.getRouteDurationMin())
                .build();

        ride = rideRepository.save(ride);

        // Update driver rides count
        driver.setTotalRides(driver.getTotalRides() + 1);
        driverRepository.save(driver);

        return ride;
    }

    public RideRequests.RideSearchResponse searchRides(
            String pickup,
            String drop,
            String date,
            String timeSlots,
            Double minPrice,
            Double maxPrice,
            int page,
            int limit) {

        if (pickup == null || drop == null || pickup.trim().isEmpty() || drop.trim().isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Both pickup and drop locations are required to search for rides");
        }

        Specification<Ride> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), "active"));

            // Location split mapping matching Node.js startsWith or contains
            String[] pickupParts = pickup.split(",");
            List<Predicate> pickupOrs = new ArrayList<>();
            for (String part : pickupParts) {
                if (part.trim().length() > 2) {
                    pickupOrs.add(cb.like(cb.lower(root.get("startLocation")), "%" + part.trim().toLowerCase() + "%"));
                }
            }
            if (!pickupOrs.isEmpty()) {
                predicates.add(cb.or(pickupOrs.toArray(new Predicate[0])));
            } else {
                predicates.add(cb.like(cb.lower(root.get("startLocation")), "%" + pickup.trim().toLowerCase() + "%"));
            }

            String[] dropParts = drop.split(",");
            List<Predicate> dropOrs = new ArrayList<>();
            for (String part : dropParts) {
                if (part.trim().length() > 2) {
                    dropOrs.add(cb.like(cb.lower(root.get("endLocation")), "%" + part.trim().toLowerCase() + "%"));
                }
            }
            if (!dropOrs.isEmpty()) {
                predicates.add(cb.or(dropOrs.toArray(new Predicate[0])));
            } else {
                predicates.add(cb.like(cb.lower(root.get("endLocation")), "%" + drop.trim().toLowerCase() + "%"));
            }

            // Date filtering
            if (date != null && !date.trim().isEmpty()) {
                LocalDate searchDate = LocalDate.parse(date);
                LocalDateTime startOfDay = searchDate.atStartOfDay();
                LocalDateTime endOfDay = searchDate.atTime(23, 59, 59);
                predicates.add(cb.between(root.get("scheduledTime"), startOfDay, endOfDay));
            }

            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("pricePerSeat"), BigDecimal.valueOf(minPrice)));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("pricePerSeat"), BigDecimal.valueOf(maxPrice)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.ASC, "scheduledTime"));
        Page<Ride> ridePage = rideRepository.findAll(spec, pageable);

        List<RideRequests.RideDto> dtoList = new ArrayList<>();
        for (Ride ride : ridePage.getContent()) {
            dtoList.add(mapToDto(ride));
        }

        return RideRequests.RideSearchResponse.builder()
                .rides(dtoList)
                .pagination(RideRequests.PaginationDto.builder()
                        .page(page)
                        .limit(limit)
                        .total(ridePage.getTotalElements())
                        .totalPages(ridePage.getTotalPages())
                        .build())
                .build();
    }

    public Ride getRideDetails(String id) {
        return rideRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Ride not found"));
    }

    public List<Ride> getDriverRides(String userId) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "Driver profile not found"));
        return rideRepository.findByDriverIdOrderByCreatedAtDesc(driver.getId());
    }

    @Transactional
    public Ride startRide(String userId, String rideId) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "Driver profile not found"));

        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Ride not found"));

        if (!ride.getDriver().getId().equals(driver.getId())) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Unauthorized to start this ride");
        }

        ride.setStatus("ongoing");
        ride.setStartedAt(LocalDateTime.now());
        return rideRepository.save(ride);
    }

    @Transactional
    public Ride endRide(String userId, String rideId) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "Driver profile not found"));

        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Ride not found"));

        if (!ride.getDriver().getId().equals(driver.getId())) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Unauthorized to end this ride");
        }

        ride.setStatus("completed");
        ride.setCompletedAt(LocalDateTime.now());
        return rideRepository.save(ride);
    }

    @Transactional
    public Ride cancelRide(String userId, String rideId) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "Driver profile not found"));

        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Ride not found"));

        if (!ride.getDriver().getId().equals(driver.getId())) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Unauthorized to cancel this ride");
        }

        ride.setStatus("cancelled");
        return rideRepository.save(ride);
    }

    private RideRequests.RideDto mapToDto(Ride ride) {
        Driver d = ride.getDriver();
        return RideRequests.RideDto.builder()
                .id(ride.getId())
                .startLocation(ride.getStartLocation())
                .endLocation(ride.getEndLocation())
                .startLatitude(ride.getStartLatitude())
                .startLongitude(ride.getStartLongitude())
                .endLatitude(ride.getEndLatitude())
                .endLongitude(ride.getEndLongitude())
                .scheduledTime(ride.getScheduledTime().format(DateTimeFormatter.ISO_DATE_TIME))
                .seatsAvailable(ride.getSeatsAvailable())
                .seatsBooked(ride.getSeatsBooked())
                .pricePerSeat(ride.getPricePerSeat())
                .perKmRate(ride.getPerKmRate())
                .distanceKm(ride.getDistanceKm())
                .status(ride.getStatus())
                .isSurge(ride.getIsSurge())
                .surgeMultiplier(ride.getSurgeMultiplier())
                .routePolyline(ride.getRoutePolyline())
                .startCity(ride.getStartCity())
                .startState(ride.getStartState())
                .endCity(ride.getEndCity())
                .endState(ride.getEndState())
                .driver(RideRequests.DriverDto.builder()
                        .id(d.getId())
                        .firstName(d.getUser().getFirstName())
                        .lastName(d.getUser().getLastName())
                        .mobile(d.getUser().getMobile())
                        .profilePhotoUrl(d.getUser().getProfilePhotoUrl())
                        .averageRating(d.getAverageRating() != null ? d.getAverageRating().doubleValue() : 0.0)
                        .totalRatings(d.getTotalRatings() != null ? d.getTotalRatings() : 0)
                        .build())
                .build();
    }

    private Map<String, String> getCityAndState(double lat, double lng) {
        Map<String, String> result = new HashMap<>();
        result.put("city", null);
        result.put("state", null);

        try {
            if (googleMapsApiKey == null || googleMapsApiKey.trim().isEmpty() || googleMapsApiKey.startsWith("your_")) {
                return result;
            }

            String url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + lat + "," + lng + "&key=" + googleMapsApiKey;
            RestTemplate restTemplate = new RestTemplate();
            Map<?, ?> response = restTemplate.getForObject(url, Map.class);

            if (response != null && response.containsKey("results")) {
                List<?> results = (List<?>) response.get("results");
                if (!results.isEmpty()) {
                    Map<?, ?> firstResult = (Map<?, ?>) results.get(0);
                    List<?> addressComponents = (List<?>) firstResult.get("address_components");

                    String city = null;
                    String state = null;
                    String district = null;

                    for (Object componentObj : addressComponents) {
                        Map<?, ?> component = (Map<?, ?>) componentObj;
                        List<?> types = (List<?>) component.get("types");

                        if (types.contains("locality")) {
                            city = (String) component.get("long_name");
                        }
                        if (types.contains("administrative_area_level_1")) {
                            state = (String) component.get("long_name");
                        }
                        if (types.contains("administrative_area_level_2")) {
                            district = (String) component.get("long_name");
                        }
                    }

                    if (city == null) {
                        city = district;
                    }

                    result.put("city", city);
                    result.put("state", state);
                }
            }
        } catch (Exception e) {
            System.err.println("Google Geocoding API fail: " + e.getMessage());
        }

        return result;
    }

    private void validateState(String stateName) {
        Optional<ServiceState> state = serviceStateRepository.findByNameAndIsActive(stateName, true);
        if (state.isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Services are not active in " + stateName);
        }
    }

    private Map<?, ?> getSurgeSettings(String city) {
        try {
            String cacheKey = "admin:surge-pricing-settings:global";
            if (city != null) {
                cacheKey = "admin:surge-pricing-settings:city:" + city;
            }

            String cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                return objectMapper.readValue(cached, Map.class);
            }
        } catch (Exception e) {
            // Ignored
        }
        return null;
    }
}
