package com.optivem.eshop.backend.api.exception;

import com.optivem.eshop.backend.core.exceptions.NotExistValidationException;
import com.optivem.eshop.backend.core.exceptions.ValidationException;
import com.optivem.eshop.backend.core.validation.TypeValidationMessageExtractor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final Pattern CLASS_NAME_PATTERN = Pattern.compile("(com\\.optivem\\.eshop\\.backend\\.core\\.dtos\\.[^\\[\\]\"\\s\\)]+)");

    @Value("${error.types.validation-error}")
    private String validationErrorTypeUri;

    @Value("${error.types.resource-not-found}")
    private String resourceNotFoundTypeUri;

    @Value("${error.types.bad-request}")
    private String badRequestTypeUri;

    @Value("${error.types.internal-server-error}")
    private String internalServerErrorTypeUri;


    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ProblemDetail> handleValidationException(ValidationException ex) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNPROCESSABLE_ENTITY,
                ex.getMessage()
        );
        problemDetail.setType(URI.create(validationErrorTypeUri));
        problemDetail.setTitle("Validation Error");
        problemDetail.setProperty("timestamp", Instant.now());

        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(problemDetail);
    }

    @ExceptionHandler(NotExistValidationException.class)
    public ResponseEntity<ProblemDetail> handleNotExistValidationException(NotExistValidationException ex) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND,
                ex.getMessage()
        );
        problemDetail.setType(URI.create(resourceNotFoundTypeUri));
        problemDetail.setTitle("Resource Not Found");
        problemDetail.setProperty("timestamp", Instant.now());

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problemDetail);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidationExceptions(MethodArgumentNotValidException ex) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "The request contains one or more validation errors"
        );
        problemDetail.setType(URI.create(validationErrorTypeUri));
        problemDetail.setTitle("Validation Error");
        problemDetail.setProperty("timestamp", Instant.now());

        // Add field-level errors
        List<Map<String, Object>> errors = new ArrayList<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            Map<String, Object> errorDetail = new HashMap<>();
            errorDetail.put("field", ((FieldError) error).getField());
            errorDetail.put("message", error.getDefaultMessage());
            errorDetail.put("code", error.getCode());
            errorDetail.put("rejectedValue", ((FieldError) error).getRejectedValue());
            errors.add(errorDetail);
        });
        problemDetail.setProperty("errors", errors);

        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(problemDetail);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ProblemDetail> handleHttpMessageNotReadableException(HttpMessageNotReadableException ex) {
        log.debug("HttpMessageNotReadableException: {}", ex.getMessage());

        ProblemDetail problemDetail = tryParseFieldError(ex.getMessage());
        if (problemDetail != null) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(problemDetail);
        }

        if (ex.getCause() != null) {
            log.debug("Root cause: {}", ex.getCause().getMessage());
            problemDetail = tryParseFieldError(ex.getCause().getMessage());
            if (problemDetail != null) {
                return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(problemDetail);
            }
        }

        problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "Invalid request format"
        );
        problemDetail.setType(URI.create(badRequestTypeUri));
        problemDetail.setTitle("Bad Request");
        problemDetail.setProperty("timestamp", Instant.now());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(problemDetail);
    }

    private ProblemDetail tryParseFieldError(String message) {
        if (message == null) {
            return null;
        }

        // Try to extract the DTO class name from the exception message
        Class<?> dtoClass = extractDtoClass(message);
        if (dtoClass == null) {
            return null;
        }

        // Extract field validation messages from the DTO class annotations
        Map<String, String> fieldErrorPatterns = TypeValidationMessageExtractor.extractFieldMessages(dtoClass);

        String lowerMessage = message.toLowerCase();

        return fieldErrorPatterns.entrySet().stream()
                .filter(entry -> lowerMessage.contains(entry.getKey()))
                .findFirst()
                .map(entry -> {
                    ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                            HttpStatus.UNPROCESSABLE_ENTITY,
                            entry.getValue()
                    );
                    problemDetail.setType(URI.create(validationErrorTypeUri));
                    problemDetail.setTitle("Validation Error");
                    problemDetail.setProperty("timestamp", Instant.now());
                    return problemDetail;
                })
                .orElse(null);
    }

    private Class<?> extractDtoClass(String message) {
        // Try to find the DTO class name in the exception message
        Matcher matcher = CLASS_NAME_PATTERN.matcher(message);
        if (matcher.find()) {
            String className = matcher.group(1);
            try {
                return Class.forName(className);
            } catch (ClassNotFoundException e) {
                log.debug("Could not load class: {}", className);
            }
        }
        return null;
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleGeneralException(Exception ex) {
        log.error("Unexpected error occurred", ex);

        // Log the full cause chain
        Throwable cause = ex.getCause();
        int depth = 1;
        while (cause != null && depth < 10) {
            log.error("  Caused by [{}]: {}", depth, cause.getMessage(), cause);
            cause = cause.getCause();
            depth++;
        }

        // Build detailed error message with root cause
        String rootCauseMessage = getRootCauseMessage(ex);
        String fullMessage = "Internal server error: " + ex.getMessage();
        if (rootCauseMessage != null && !rootCauseMessage.equals(ex.getMessage())) {
            fullMessage += " | Root cause: " + rootCauseMessage;
        }

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                fullMessage
        );
        problemDetail.setType(URI.create(internalServerErrorTypeUri));
        problemDetail.setTitle("Internal Server Error");
        problemDetail.setProperty("timestamp", Instant.now());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(problemDetail);
    }

    private String getRootCauseMessage(Throwable ex) {
        Throwable cause = ex;
        while (cause.getCause() != null) {
            cause = cause.getCause();
        }
        return cause.getMessage();
    }
}

