package com.optivem.eshop.backend.core.repositories;

import com.optivem.eshop.backend.core.entities.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    // Spring Data JPA will automatically implement:
    // - save(Order order) - for both add and update
    // - findById(Long id) - returns Optional<Order>
    // - All other CRUD operations
    
    // Find order by orderNumber (business identifier)
    Optional<Order> findByOrderNumber(String orderNumber);
    
    // Find all orders sorted by timestamp descending (most recent first)
    List<Order> findAllByOrderByOrderTimestampDesc();
    
    // Find orders by order number containing the search term (case-insensitive), sorted by timestamp descending
    @Query("SELECT o FROM Order o WHERE LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :orderNumber, '%')) ORDER BY o.orderTimestamp DESC")
    List<Order> findByOrderNumberContainingIgnoreCaseOrderByOrderTimestampDesc(@Param("orderNumber") String orderNumber);
}
