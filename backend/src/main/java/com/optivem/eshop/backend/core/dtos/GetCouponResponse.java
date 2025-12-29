package com.optivem.eshop.backend.core.dtos;

import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
public class GetCouponResponse {
    private String code;
    private BigDecimal discountRate;
    private Instant validFrom;
    private Instant validTo;
    private int usageLimit;
    private int usedCount;
}
