package com.hushryd.backend.service;

import com.hushryd.backend.dto.AddressRequests;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.entity.Customer;
import com.hushryd.backend.entity.SavedAddress;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.repository.CustomerRepository;
import com.hushryd.backend.repository.SavedAddressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AddressService {

    @Autowired
    private SavedAddressRepository savedAddressRepository;

    @Autowired
    private CustomerRepository customerRepository;

    public List<AddressRequests.AddressDto> getAddresses(String userId) {
        List<SavedAddress> addresses = savedAddressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId);
        return addresses.stream().map(addr -> AddressRequests.AddressDto.builder()
                .id(addr.getId())
                .label(addr.getAddressType())
                .displayName(addr.getAddress())
                .latitude(addr.getLatitude())
                .longitude(addr.getLongitude())
                .isDefault(addr.getIsDefault())
                .build()).collect(Collectors.toList());
    }

    @Transactional
    public AddressRequests.AddressDto addAddress(String userId, AddressRequests.AddAddressRequest request) {
        String label = request.getLabel();
        if (label == null || !List.of("home", "work", "other").contains(label.toLowerCase())) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Label must be home, work, or other");
        }

        String displayName = request.getDisplayName();
        if (displayName == null || displayName.trim().isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Display name is required");
        }

        if (request.getLatitude() == null || request.getLongitude() == null) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Latitude and longitude are required");
        }

        long count = savedAddressRepository.countByUserId(userId);
        if (count >= 3) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Maximum 3 saved addresses allowed (Home, Work, Other)");
        }

        Optional<SavedAddress> existingOpt = savedAddressRepository.findByUserIdAndAddressType(userId, label.toLowerCase());
        if (existingOpt.isPresent()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, label + " address already exists. Please update or delete it first.");
        }

        Optional<Customer> customerOpt = customerRepository.findByUserId(userId);
        String customerId = customerOpt.map(Customer::getId).orElse(null);

        SavedAddress savedAddress = SavedAddress.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .customerId(customerId)
                .addressType(label.toLowerCase())
                .address(displayName.trim())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .isDefault(false)
                .build();
        savedAddress = savedAddressRepository.save(savedAddress);

        return AddressRequests.AddressDto.builder()
                .id(savedAddress.getId())
                .label(savedAddress.getAddressType())
                .displayName(savedAddress.getAddress())
                .latitude(savedAddress.getLatitude())
                .longitude(savedAddress.getLongitude())
                .isDefault(savedAddress.getIsDefault())
                .build();
    }

    @Transactional
    public AddressRequests.AddressDto updateAddress(String userId, String addressId, AddressRequests.UpdateAddressRequest request) {
        SavedAddress savedAddress = savedAddressRepository.findById(addressId)
                .orElseThrow(() -> new ApiException(ErrorCode.ADDRESS_NOT_FOUND, "Address not found"));

        if (!savedAddress.getUserId().equals(userId)) {
            throw new ApiException(ErrorCode.AUTH_FORBIDDEN, "Forbidden: Insufficient permissions");
        }

        if (request.getDisplayName() != null && request.getDisplayName().trim().isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Display name is required");
        }

        savedAddress.setAddress(request.getDisplayName() != null ? request.getDisplayName().trim() : savedAddress.getAddress());
        savedAddress.setLatitude(request.getLatitude() != null ? request.getLatitude() : savedAddress.getLatitude());
        savedAddress.setLongitude(request.getLongitude() != null ? request.getLongitude() : savedAddress.getLongitude());
        savedAddress = savedAddressRepository.save(savedAddress);

        return AddressRequests.AddressDto.builder()
                .id(savedAddress.getId())
                .label(savedAddress.getAddressType())
                .displayName(savedAddress.getAddress())
                .latitude(savedAddress.getLatitude())
                .longitude(savedAddress.getLongitude())
                .isDefault(savedAddress.getIsDefault())
                .build();
    }

    @Transactional
    public void deleteAddress(String userId, String addressId) {
        SavedAddress savedAddress = savedAddressRepository.findById(addressId)
                .orElseThrow(() -> new ApiException(ErrorCode.ADDRESS_NOT_FOUND, "Address not found"));

        if (!savedAddress.getUserId().equals(userId)) {
            throw new ApiException(ErrorCode.AUTH_FORBIDDEN, "Forbidden: Insufficient permissions");
        }

        savedAddressRepository.delete(savedAddress);
    }
}
