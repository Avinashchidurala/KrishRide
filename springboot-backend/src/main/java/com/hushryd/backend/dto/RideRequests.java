package com.hushryd.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

public class RideRequests {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PublishRideRequest {
        private String vehicleId;
        private String pickupLocation;
        private String pickupLatitude;
        private String pickupLongitude;
        private String dropLocation;
        private String dropLatitude;
        private String dropLongitude;
        private List<StopDto> stops;
        private String scheduledDate; // yyyy-MM-dd
        private String scheduledTime; // HH:mm
        private String scheduledDateTime; // ISO Date String
        private Integer seatsAvailable;
        private Double pricePerSeat;
        private Double perKmRate;
        private Double distanceKm;
        private String routePolyline;
        private Integer routeDurationMin;
        private Double routeDistanceKm;
        private Double routeBufferKm;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StopDto {
        private String location;
        private String latitude;
        private String longitude;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RideSearchResponse {
        private List<RideDto> rides;
        private PaginationDto pagination;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RideDto {
        private String id;
        private String startLocation;
        private String endLocation;
        private BigDecimal startLatitude;
        private BigDecimal startLongitude;
        private BigDecimal endLatitude;
        private BigDecimal endLongitude;
        private String scheduledTime;
        private Integer seatsAvailable;
        private Integer seatsBooked;
        private BigDecimal pricePerSeat;
        private BigDecimal perKmRate;
        private BigDecimal distanceKm;
        private String status;
        private Boolean isSurge;
        private BigDecimal surgeMultiplier;
        private String routePolyline;
        private String startCity;
        private String startState;
        private String endCity;
        private String endState;
        private DriverDto driver;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DriverDto {
        private String id;
        private String firstName;
        private String lastName;
        private String mobile;
        private String profilePhotoUrl;
        private Double averageRating;
        private Integer totalRatings;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaginationDto {
        private Integer page;
        private Integer limit;
        private Long total;
        private Integer totalPages;
    }
}
