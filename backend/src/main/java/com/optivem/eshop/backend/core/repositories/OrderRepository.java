package com.optivem.eshop.backend.core.repositories;

import com.optivem.eshop.backend.core.entities.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
    // Spring Data JPA will automatically implement:
    // - save(Order order) - for both add and update
    // - findById(String orderNumber) - returns Optional<Order>
    // - All other CRUD operations
}
