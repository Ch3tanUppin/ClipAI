package com.clipai.api.common;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    ResponseEntity<Map<String, Object>> api(ApiException ex, HttpServletRequest request) {
        return error(ex.status(), ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, Object>> validation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        return error(HttpStatus.BAD_REQUEST, "Validation failed", request.getRequestURI());
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Map<String, Object>> fallback(Exception ex, HttpServletRequest request) {
        log.error("Unhandled error at {}", request.getRequestURI(), ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error", request.getRequestURI());
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message, String path) {
        return ResponseEntity.status(status).body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "message", message,
                "path", path
        ));
    }
}

