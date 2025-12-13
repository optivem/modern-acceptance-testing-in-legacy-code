package com.optivem.eshop.backend.core.services;

import com.optivem.eshop.backend.core.dtos.GetOrderResponse;
import com.optivem.eshop.backend.core.dtos.PlaceOrderRequest;
import com.optivem.eshop.backend.core.dtos.PlaceOrderResponse;
import com.optivem.eshop.backend.core.entities.Order;
import com.optivem.eshop.backend.core.entities.OrderStatus;
import com.optivem.eshop.backend.core.exceptions.NotExistValidationException;
import com.optivem.eshop.backend.core.exceptions.ValidationException;
import com.optivem.eshop.backend.core.repositories.OrderRepository;
import com.optivem.eshop.backend.core.services.external.ErpGateway;
import com.optivem.eshop.backend.core.services.external.TaxGateway;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.MonthDay;

@Service
public class OrderService {

    public static final MonthDay DECEMBER_31 = MonthDay.of(12, 31);
    private static final LocalTime CANCELLATION_BLOCK_START = LocalTime.of(22, 0);
    private static final LocalTime CANCELLATION_BLOCK_END = LocalTime.of(23, 0);

    private static final LocalTime ORDER_PLACEMENT_CUTOFF_TIME = LocalTime.of(17, 0);

    private final OrderRepository orderRepository;
    private final ErpGateway erpGateway;
    private final TaxGateway taxGateway;

    public OrderService(OrderRepository orderRepository, ErpGateway erpGateway, TaxGateway taxGateway) {
        this.orderRepository = orderRepository;
        this.erpGateway = erpGateway;
        this.taxGateway = taxGateway;
    }

    public PlaceOrderResponse placeOrder(PlaceOrderRequest request) {
        var sku = request.getSku();
        var quantity = request.getQuantity();
        var country = request.getCountry();

        var orderNumber = generateOrderNumber();
        var orderTimestamp = Instant.now();
        var unitPrice = getUnitPrice(sku);
        var discountRate = getDiscountRate();
        var taxRate = getTaxRate(country);

        var originalPrice = unitPrice.multiply(BigDecimal.valueOf(quantity));
        var discountAmount = originalPrice.multiply(discountRate);
        var subtotalPrice = originalPrice.subtract(discountAmount);
        var taxAmount = subtotalPrice.multiply(taxRate);
        var totalPrice = subtotalPrice.add(taxAmount);

        var order = new Order(orderNumber, orderTimestamp, country,
                sku, quantity, unitPrice, originalPrice,
                discountRate, discountAmount, subtotalPrice,
                taxRate, taxAmount, totalPrice, OrderStatus.PLACED);

        orderRepository.save(order);

        var response = new PlaceOrderResponse();
        response.setOrderNumber(orderNumber);
        return response;
    }

    private BigDecimal getUnitPrice(String sku) {
        var productDetails = erpGateway.getProductDetails(sku);
        if (productDetails.isEmpty()) {
            throw new ValidationException("sku", "Product does not exist for SKU: " + sku);
        }

        return productDetails.get().getPrice();
    }

    private BigDecimal getDiscountRate() {
        var now = LocalDateTime.now();
        var currentTime = now.toLocalTime();

        if(currentTime.isBefore(ORDER_PLACEMENT_CUTOFF_TIME) || currentTime.equals(ORDER_PLACEMENT_CUTOFF_TIME)) {
            return BigDecimal.ZERO;
        }

        return BigDecimal.valueOf(0.15);
    }

    private BigDecimal getTaxRate(String country) {
        var countryDetails = taxGateway.getTaxDetails(country);
        if (countryDetails.isEmpty()) {
            throw new ValidationException("Country does not exist: " + country);
        }

        return countryDetails.get().getTaxRate();
    }

    public GetOrderResponse getOrder(String orderNumber) {
        var optionalOrder = orderRepository.findById(orderNumber);

        if(optionalOrder.isEmpty()) {
            throw new NotExistValidationException("Order " + orderNumber + " does not exist.");
        }

        var order = optionalOrder.get();

        var response = new GetOrderResponse();
        response.setOrderNumber(orderNumber);
        response.setSku(order.getSku());
        response.setQuantity(order.getQuantity());
        response.setUnitPrice(order.getUnitPrice());
        response.setOriginalPrice(order.getOriginalPrice());
        response.setDiscountRate(order.getDiscountRate());
        response.setDiscountAmount(order.getDiscountAmount());
        response.setSubtotalPrice(order.getSubtotalPrice());
        response.setTaxRate(order.getTaxRate());
        response.setTaxAmount(order.getTaxAmount());
        response.setTotalPrice(order.getTotalPrice());
        response.setStatus(order.getStatus());
        response.setCountry(order.getCountry());

        return response;
    }

    public void cancelOrder(String orderNumber) {
        if (orderNumber == null || orderNumber.trim().isEmpty()) {
            throw new ValidationException("Order number must not be empty");
        }

        var optionalOrder = orderRepository.findById(orderNumber);

        if(optionalOrder.isEmpty()) {
            throw new NotExistValidationException("Order " + orderNumber + " does not exist.");
        }

        var order = optionalOrder.get();

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ValidationException("Order has already been cancelled");
        }

        var now = LocalDateTime.now();
        var currentDate = MonthDay.from(now);
        var currentTime = now.toLocalTime();

        if (currentDate.equals(DECEMBER_31) &&
            currentTime.isAfter(CANCELLATION_BLOCK_START) && 
            currentTime.isBefore(CANCELLATION_BLOCK_END)) {
            throw new ValidationException("Order cancellation is not allowed on December 31st between 22:00 and 23:00");
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
    }

    private String generateOrderNumber() {
        return "ORD-" + java.util.UUID.randomUUID();
    }
}
