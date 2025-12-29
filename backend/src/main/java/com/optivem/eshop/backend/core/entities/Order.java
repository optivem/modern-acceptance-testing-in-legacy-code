package com.optivem.eshop.backend.core.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
public class Order {
    @Id
    @Column(name = "order_number", nullable = false, unique = true)
    private String orderNumber;

    @Column(name = "order_timestamp", nullable = false)
    private Instant orderTimestamp;

    @Column(name = "country", nullable = false)
    private String country;

    @Column(name = "sku", nullable = false)
    private String sku;

    @Column(name = "quantity", nullable = false)
    private int quantity;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "subtotal_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotalPrice;

    @Column(name = "discount_rate", nullable = false, precision = 5, scale = 4)
    private BigDecimal discountRate;

    @Column(name = "discount_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "pre_tax_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal preTaxTotal;

    @Column(name = "tax_rate", nullable = false, precision = 5, scale = 4)
    private BigDecimal taxRate;

    @Column(name = "tax_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal taxAmount;

    @Column(name = "total_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OrderStatus status;

    public Order(String orderNumber, Instant orderTimestamp, String country,
                 String sku, int quantity, BigDecimal unitPrice, BigDecimal subtotalPrice,
                 BigDecimal discountRate, BigDecimal discountAmount, BigDecimal preTaxTotal,
                 BigDecimal taxRate, BigDecimal taxAmount, BigDecimal totalPrice, OrderStatus status) {
        if (orderNumber == null) {
            throw new IllegalArgumentException("orderNumber cannot be null");
        }
        if (orderTimestamp == null) {
            throw new IllegalArgumentException("orderTimestamp cannot be null");
        }
        if (country == null) {
            throw new IllegalArgumentException("country cannot be null");
        }
        if (sku == null) {
            throw new IllegalArgumentException("sku cannot be null");
        }
        if (unitPrice == null) {
            throw new IllegalArgumentException("unitPrice cannot be null");
        }
        if (subtotalPrice == null) {
            throw new IllegalArgumentException("subtotalPrice cannot be null");
        }
        if (discountRate == null) {
            throw new IllegalArgumentException("discountRate cannot be null");
        }
        if (discountAmount == null) {
            throw new IllegalArgumentException("discountAmount cannot be null");
        }
        if (preTaxTotal == null) {
            throw new IllegalArgumentException("preTaxTotal cannot be null");
        }
        if (taxRate == null) {
            throw new IllegalArgumentException("taxRate cannot be null");
        }
        if (taxAmount == null) {
            throw new IllegalArgumentException("taxAmount cannot be null");
        }
        if (totalPrice == null) {
            throw new IllegalArgumentException("totalPrice cannot be null");
        }
        if (status == null) {
            throw new IllegalArgumentException("status cannot be null");
        }
        
        this.orderNumber = orderNumber;
        this.orderTimestamp = orderTimestamp;
        this.country = country;
        this.sku = sku;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.subtotalPrice = subtotalPrice;
        this.discountRate = discountRate;
        this.discountAmount = discountAmount;
        this.preTaxTotal = preTaxTotal;
        this.taxRate = taxRate;
        this.taxAmount = taxAmount;
        this.totalPrice = totalPrice;
        this.status = status;

    }
}
