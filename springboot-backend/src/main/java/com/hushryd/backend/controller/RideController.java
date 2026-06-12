package com.hushryd.backend.controller;

import com.hushryd.backend.dto.ApiResponse;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.dto.RideRequests;
import com.hushryd.backend.entity.Ride;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.security.UserPrincipal;
import com.hushryd.backend.service.RideService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rides")
public class RideController {

    @Autowired
    private RideService rideService;

    @PostMapping
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> publishRide(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody RideRequests.PublishRideRequest request) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        Ride ride = rideService.publishRide(userPrincipal.getId(), request);
        Map<String, Object> data = new HashMap<>();
        data.put("ride", ride);
        data.put("message", "Ride published successfully");

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<RideRequests.RideSearchResponse>> searchRides(
            @RequestParam(required = false) String pickup,
            @RequestParam(required = false) String drop,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String timeSlots,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {

        // Support both "from/to" and "pickup/drop" query parameter formats
        String searchPickup = from != null ? from : pickup;
        String searchDrop = to != null ? to : drop;

        RideRequests.RideSearchResponse result = rideService.searchRides(
                searchPickup, searchDrop, date, timeSlots, minPrice, maxPrice, page, limit);

        return ResponseEntity.ok(ApiResponse.<RideRequests.RideSearchResponse>builder().data(result).build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRideDetails(@PathVariable String id) {
        Ride ride = rideService.getRideDetails(id);
        Map<String, Object> data = new HashMap<>();
        data.put("ride", ride);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @GetMapping("/driver/my-rides")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<Map<String, List<Ride>>>> getDriverRides(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        List<Ride> rides = rideService.getDriverRides(userPrincipal.getId());
        Map<String, List<Ride>> data = new HashMap<>();
        data.put("rides", rides);

        return ResponseEntity.ok(ApiResponse.<Map<String, List<Ride>>>builder().data(data).build());
    }

    @PostMapping("/{id}/start")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> startRide(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String id) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        Ride ride = rideService.startRide(userPrincipal.getId(), id);
        Map<String, Object> data = new HashMap<>();
        data.put("ride", ride);
        data.put("message", "Ride started successfully");

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @PostMapping("/{id}/end")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> endRide(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String id) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        Ride ride = rideService.endRide(userPrincipal.getId(), id);
        Map<String, Object> data = new HashMap<>();
        data.put("ride", ride);
        data.put("message", "Ride completed successfully");

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @PostMapping("/driver-ride-cancel/{id}")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cancelRide(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String id) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        Ride ride = rideService.cancelRide(userPrincipal.getId(), id);
        Map<String, Object> data = new HashMap<>();
        data.put("ride", ride);
        data.put("message", "Ride cancelled successfully");

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }
}
