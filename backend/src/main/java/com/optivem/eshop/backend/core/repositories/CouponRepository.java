package com.optivem.eshop.backend.core.repositories;

import com.optivem.eshop.backend.core.entities.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, String> {
}
