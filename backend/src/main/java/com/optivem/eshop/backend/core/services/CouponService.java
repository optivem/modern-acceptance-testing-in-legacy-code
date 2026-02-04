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

    private static final String FIELD_COUPON_CODE = "couponCode";
    private static final String FIELD_VALID_FROM = "validFrom";
    private static final String FIELD_VALID_TO = "validTo";
    private static final String MSG_COUPON_DOES_NOT_EXIST = "Coupon code %s does not exist";
    private static final String MSG_COUPON_NOT_YET_VALID = "Coupon code %s is not yet valid";
    private static final String MSG_COUPON_EXPIRED = "Coupon code %s has expired";
    private static final String MSG_COUPON_USAGE_LIMIT_REACHED = "Coupon code %s has exceeded its usage limit";
    private static final String MSG_COUPON_CODE_ALREADY_EXISTS = "Coupon code %s already exists";
    private static final String MSG_VALID_FROM_MUST_BE_FUTURE = "validFrom must be in the future";
    private static final String MSG_VALID_TO_MUST_BE_FUTURE = "validTo must be in the future";

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

        var optionalCoupon = couponRepository.findByCode(couponCode);

        if (optionalCoupon.isEmpty()) {
            throwCouponValidationException(MSG_COUPON_DOES_NOT_EXIST, couponCode);
        }

        var coupon = optionalCoupon.get();
        var now = clockGateway.getCurrentTime();

        // If validFrom is set and current time is before it, coupon is not yet valid
        if (coupon.getValidFrom() != null && now.isBefore(coupon.getValidFrom())) {
            throwCouponValidationException(MSG_COUPON_NOT_YET_VALID, couponCode);
        }

        // If validTo is set and current time is after it, coupon has expired
        if (coupon.getValidTo() != null && now.isAfter(coupon.getValidTo())) {
            throwCouponValidationException(MSG_COUPON_EXPIRED, couponCode);
        }

        // Check usage limit only if it's set (not null)
        if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
            throwCouponValidationException(MSG_COUPON_USAGE_LIMIT_REACHED, couponCode);
        }

        return coupon.getDiscountRate();
    }

    public void incrementUsageCount(String couponCode) {
        var optionalCoupon = couponRepository.findByCode(couponCode);
        if (optionalCoupon.isPresent()) {
            var coupon = optionalCoupon.get();
            coupon.setUsedCount(coupon.getUsedCount() + 1);
            couponRepository.save(coupon);
        }
    }

    public Coupon createCoupon(String couponCode, BigDecimal discountRate, Instant validFrom, Instant validTo, Integer usageLimit) {
        if (couponRepository.findByCode(couponCode).isPresent()) {
            throwCouponValidationException(MSG_COUPON_CODE_ALREADY_EXISTS, couponCode);
        }

        var currentTime = clockGateway.getCurrentTime();
        
        // Validate that validFrom is in the future
        if (validFrom != null && !validFrom.isAfter(currentTime)) {
            throw new ValidationException(FIELD_VALID_FROM, MSG_VALID_FROM_MUST_BE_FUTURE);
        }
        
        // Validate that validTo is in the future
        if (validTo != null && !validTo.isAfter(currentTime)) {
            throw new ValidationException(FIELD_VALID_TO, MSG_VALID_TO_MUST_BE_FUTURE);
        }

        // If usageLimit is null, set to unlimited (Integer.MAX_VALUE)
        int limit = usageLimit != null ? usageLimit : Integer.MAX_VALUE;
        var coupon = new Coupon(couponCode, discountRate, validFrom, validTo, limit, 0);
        return couponRepository.save(coupon);
    }

    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    private void throwCouponValidationException(String messageFormat, String couponCode) {
        throw new ValidationException(FIELD_COUPON_CODE, String.format(messageFormat, couponCode));
    }
}
