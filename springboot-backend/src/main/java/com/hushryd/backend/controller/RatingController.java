package com.hushryd.backend.controller;

import com.hushryd.backend.dto.ApiResponse;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.security.UserPrincipal;
import com.hushryd.backend.service.RatingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ratings")
public class RatingController {

    @Autowired
    private RatingService ratingService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitRating(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Map<String, Object> body) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        String bookingId = (String) body.get("bookingId");
        Number rating = (Number) body.get("rating");
        String review = (String) body.get("review");

        double ratingVal = rating != null ? rating.doubleValue() : 0.0;

        Map<String, Object> data = ratingService.submitRating(
                userPrincipal.getId(), bookingId, ratingVal, review);

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDriverRatings(
            @PathVariable String driverId) {
        Map<String, Object> data = ratingService.getDriverRatings(driverId);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @GetMapping("/my-ratings")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyRatings(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        Map<String, Object> data = ratingService.getMyRatings(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @GetMapping("/driver/{driverId}/reviews")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDriverReviews(
            @PathVariable String driverId) {
        Map<String, Object> data = ratingService.getDriverReviews(driverId);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }
}
