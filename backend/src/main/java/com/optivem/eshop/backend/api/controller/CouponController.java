package com.optivem.eshop.backend.api.controller;

import com.optivem.eshop.backend.core.dtos.PublishCouponRequest;
import com.optivem.eshop.backend.core.dtos.GetCouponResponse;
import com.optivem.eshop.backend.core.services.CouponService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void createCoupon(@Valid @RequestBody PublishCouponRequest request) {
        couponService.createCoupon(
                request.getCode(),
                request.getDiscountRate(),
                request.getValidFrom(),
                request.getValidTo(),
                request.getUsageLimit()
        );
    }

    @GetMapping
    public List<GetCouponResponse> getAllCoupons() {
        return couponService.getAllCoupons().stream()
                .map(coupon -> {
                    var response = new GetCouponResponse();
                    response.setCode(coupon.getCode());
                    response.setDiscountRate(coupon.getDiscountRate());
                    response.setValidFrom(coupon.getValidFrom());
                    response.setValidTo(coupon.getValidTo());
                    response.setUsageLimit(coupon.getUsageLimit());
                    response.setUsedCount(coupon.getUsedCount());
                    return response;
                })
                .toList();
    }
}
