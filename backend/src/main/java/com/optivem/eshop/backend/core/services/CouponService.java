package com.optivem.eshop.backend.core.services;

import com.optivem.eshop.backend.core.entities.Coupon;
import com.optivem.eshop.backend.core.exceptions.ValidationException;
import com.optivem.eshop.backend.core.repositories.CouponRepository;
import com.optivem.eshop.backend.core.services.external.ClockGateway;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
public class CouponService {

    private final CouponRepository couponRepository;
    private final ClockGateway clockGateway;

    public CouponService(CouponRepository couponRepository, ClockGateway clockGateway) {
        this.couponRepository = couponRepository;
        this.clockGateway = clockGateway;
    }

    public BigDecimal getDiscount(String couponCode) {
        // No coupon provided, no discount
        if (couponCode == null || couponCode.trim().isEmpty()) {
            return BigDecimal.ZERO;
        }

        var optionalCoupon = couponRepository.findById(couponCode);

        if (optionalCoupon.isEmpty()) {
            throw new ValidationException("couponCode", "Coupon code does not exist");
        }

        var coupon = optionalCoupon.get();
        var now = clockGateway.getCurrentTime();

        // If validFrom is set and current time is before it, coupon is not yet valid
        if (coupon.getValidFrom() != null && now.isBefore(coupon.getValidFrom())) {
            throw new ValidationException("couponCode", "Coupon is not yet valid");
        }

        // If validTo is set and current time is after it, coupon has expired
        if (coupon.getValidTo() != null && now.isAfter(coupon.getValidTo())) {
            throw new ValidationException("couponCode", "Coupon has expired");
        }

        if (coupon.getUsedCount() >= coupon.getUsageLimit()) {
            throw new ValidationException("couponCode", "Coupon usage limit has been reached");
        }

        return coupon.getDiscountRate();
    }

    public void incrementUsageCount(String couponCode) {
        var optionalCoupon = couponRepository.findById(couponCode);
        if (optionalCoupon.isPresent()) {
            var coupon = optionalCoupon.get();
            coupon.setUsedCount(coupon.getUsedCount() + 1);
            couponRepository.save(coupon);
        }
    }

    public Coupon createCoupon(String code, BigDecimal discountRate, Instant validFrom, Instant validTo, Integer usageLimit) {
        if (couponRepository.existsById(code)) {
            throw new ValidationException("code", "Coupon code already exists");
        }

        // If usageLimit is null, set to unlimited (Integer.MAX_VALUE)
        int limit = usageLimit != null ? usageLimit : Integer.MAX_VALUE;
        var coupon = new Coupon(code, discountRate, validFrom, validTo, limit, 0);
        return couponRepository.save(coupon);
    }

    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }
}
