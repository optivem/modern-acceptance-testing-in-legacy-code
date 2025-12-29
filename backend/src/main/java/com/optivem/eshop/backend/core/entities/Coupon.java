package com.optivem.eshop.backend.core.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "coupons")
@Data
@NoArgsConstructor
public class Coupon {

    @Id
    @Column(name = "code", nullable = false, unique = true)
    private String code;

    @Column(name = "discount_rate", nullable = false, precision = 5, scale = 4)
    private BigDecimal discountRate;

    @Column(name = "valid_from", nullable = true)
    private Instant validFrom;

    @Column(name = "valid_to", nullable = true)
    private Instant validTo;

    @Column(name = "usage_limit", nullable = false)
    private Integer usageLimit;

    @Column(name = "used_count", nullable = false)
    private Integer usedCount;

    public Coupon(String code, BigDecimal discountRate, Instant validFrom, Instant validTo, Integer usageLimit, Integer usedCount) {
        if (code == null || code.trim().isEmpty()) {
            throw new IllegalArgumentException("code cannot be null or empty");
        }
        if (discountRate == null) {
            throw new IllegalArgumentException("discountRate cannot be null");
        }
        if (discountRate.compareTo(BigDecimal.ZERO) < 0 || discountRate.compareTo(BigDecimal.ONE) > 0) {
            throw new IllegalArgumentException("discountRate must be between 0 and 1");
        }
        // Only validate date order if both dates are provided
        if (validFrom != null && validTo != null && validTo.isBefore(validFrom)) {
            throw new IllegalArgumentException("validTo must be after validFrom");
        }
        if (usageLimit == null) {
            throw new IllegalArgumentException("usageLimit cannot be null");
        }
        if (usageLimit < 0) {
            throw new IllegalArgumentException("usageLimit must be non-negative");
        }
        if (usedCount == null) {
            throw new IllegalArgumentException("usedCount cannot be null");
        }
        if (usedCount < 0) {
            throw new IllegalArgumentException("usedCount must be non-negative");
        }

        this.code = code;
        this.discountRate = discountRate;
        this.validFrom = validFrom;
        this.validTo = validTo;
        this.usageLimit = usageLimit;
        this.usedCount = usedCount;
    }
}
