package com.hushryd.backend.controller;

import com.hushryd.backend.dto.AddressRequests;
import com.hushryd.backend.dto.ApiResponse;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.security.UserPrincipal;
import com.hushryd.backend.service.AddressService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/addresses")
public class AddressController {

    @Autowired
    private AddressService addressService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, List<AddressRequests.AddressDto>>>> getAddresses(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        List<AddressRequests.AddressDto> addresses = addressService.getAddresses(userPrincipal.getId());
        Map<String, List<AddressRequests.AddressDto>> data = new HashMap<>();
        data.put("addresses", addresses);

        return ResponseEntity.ok(ApiResponse.<Map<String, List<AddressRequests.AddressDto>>>builder().data(data).build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> addAddress(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody AddressRequests.AddAddressRequest request) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        AddressRequests.AddressDto addressDto = addressService.addAddress(userPrincipal.getId(), request);
        Map<String, Object> data = new HashMap<>();
        data.put("address", addressDto);
        data.put("message", "Address saved successfully");

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateAddress(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String id,
            @RequestBody AddressRequests.UpdateAddressRequest request) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        AddressRequests.AddressDto addressDto = addressService.updateAddress(userPrincipal.getId(), id, request);
        Map<String, Object> data = new HashMap<>();
        data.put("address", addressDto);
        data.put("message", "Address updated successfully");

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteAddress(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String id) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        addressService.deleteAddress(userPrincipal.getId(), id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Address deleted successfully");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/suggestions")
    public ResponseEntity<ApiResponse<Map<String, List<Map<String, Object>>>>> getSuggestions(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        List<AddressRequests.AddressDto> addresses = addressService.getAddresses(userPrincipal.getId());
        List<Map<String, Object>> suggestions = addresses.stream().map(addr -> {
            Map<String, Object> sug = new HashMap<>();
            sug.put("id", addr.getId());
            sug.put("label", addr.getLabel());
            sug.put("displayName", addr.getDisplayName());
            sug.put("latitude", addr.getLatitude() != null ? addr.getLatitude().toString() : null);
            sug.put("longitude", addr.getLongitude() != null ? addr.getLongitude().toString() : null);
            sug.put("isDefault", addr.isDefault());
            return sug;
        }).collect(Collectors.toList());

        Map<String, List<Map<String, Object>>> data = new HashMap<>();
        data.put("suggestions", suggestions);

        return ResponseEntity.ok(ApiResponse.<Map<String, List<Map<String, Object>>>>builder().data(data).build());
    }
}
