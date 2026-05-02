package com.camposync.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        int status,
        String error,
        String message,
        List<FieldError> campos,
        Instant timestamp
) {
    public record FieldError(String campo, String mensaje) {}

    public static ApiError of(int status, String error, String message) {
        return new ApiError(status, error, message, null, Instant.now());
    }

    public static ApiError ofFields(int status, String error, String message, List<FieldError> campos) {
        return new ApiError(status, error, message, campos, Instant.now());
    }
}
