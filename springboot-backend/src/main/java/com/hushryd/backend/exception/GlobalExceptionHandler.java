package com.hushryd.backend.exception;

import com.hushryd.backend.dto.ApiErrorResponse;
import com.hushryd.backend.dto.ErrorCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.Instant;
import java.time.format.DateTimeFormatter;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiErrorResponse> handleApiException(ApiException ex) {
        ErrorCode errorCode = ex.getErrorCode();
        ApiErrorResponse.ErrorDetail errorDetail = ApiErrorResponse.ErrorDetail.builder()
                .code(errorCode.getCode())
                .message(ex.getMessage())
                .details(ex.getDetails())
                .timestamp(DateTimeFormatter.ISO_INSTANT.format(Instant.now()))
                .build();

        ApiErrorResponse response = ApiErrorResponse.builder()
                .success(false)
                .error(errorDetail)
                .build();

        return ResponseEntity.status(errorCode.getHttpStatus()).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneralException(Exception ex) {
        ex.printStackTrace();

        ApiErrorResponse.ErrorDetail errorDetail = ApiErrorResponse.ErrorDetail.builder()
                .code(ErrorCode.INTERNAL_SERVER_ERROR.getCode())
                .message(ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred")
                .timestamp(DateTimeFormatter.ISO_INSTANT.format(Instant.now()))
                .build();

        ApiErrorResponse response = ApiErrorResponse.builder()
                .success(false)
                .error(errorDetail)
                .build();

        return ResponseEntity.status(500).body(response);
    }
}
