package com.hushryd.backend.dto;

public enum ErrorCode {
    AUTH_TOKEN_REQUIRED(1001, 401),
    AUTH_TOKEN_INVALID(1002, 401),
    AUTH_TOKEN_EXPIRED(1003, 401),
    AUTH_REFRESH_TOKEN_INVALID(1004, 401),
    AUTH_REFRESH_TOKEN_EXPIRED(1005, 401),
    AUTH_UNAUTHORIZED(1006, 401),
    AUTH_FORBIDDEN(1007, 403),
    AUTH_INVALID_CREDENTIALS(1008, 401),
    AUTH_OTP_INVALID(1009, 400),
    AUTH_OTP_EXPIRED(1010, 400),
    AUTH_OTP_NOT_SENT(1011, 400),
    AUTH_USER_NOT_FOUND(1012, 404),
    AUTH_USER_INACTIVE(1013, 403),
    AUTH_ROLE_INVALID(1014, 400),

    VALIDATION_REQUIRED(2001, 400),
    VALIDATION_MISSING_FIELD(2016, 400),

    USER_NOT_FOUND(3001, 404),
    CUSTOMER_NOT_FOUND(3002, 404),
    DRIVER_NOT_FOUND(3003, 404),
    RIDE_NOT_FOUND(3004, 404),
    BOOKING_NOT_FOUND(3005, 404),
    ADDRESS_NOT_FOUND(3007, 404),

    USER_ALREADY_EXISTS(4001, 409),
    INTERNAL_SERVER_ERROR(9001, 500);

    private final int code;
    private final int httpStatus;

    ErrorCode(int code, int httpStatus) {
        this.code = code;
        this.httpStatus = httpStatus;
    }

    public int getCode() {
        return code;
    }

    public int getHttpStatus() {
        return httpStatus;
    }
}
