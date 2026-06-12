package com.hushryd.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

public class AddressRequests {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddAddressRequest {
        private String label;
        private String displayName;
        private BigDecimal latitude;
        private BigDecimal longitude;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateAddressRequest {
        private String displayName;
        private BigDecimal latitude;
        private BigDecimal longitude;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AddressDto {
        private String id;
        private String label;
        private String displayName;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private boolean isDefault;
    }
}
