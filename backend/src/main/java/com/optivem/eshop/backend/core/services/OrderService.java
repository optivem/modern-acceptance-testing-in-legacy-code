package com.optivem.eshop.backend.core.services;

import com.optivem.eshop.backend.core.dtos.BrowseOrderHistoryResponse;
import com.optivem.eshop.backend.core.dtos.ViewOrderDetailsResponse;
import com.optivem.eshop.backend.core.dtos.PlaceOrderRequest;
import com.optivem.eshop.backend.core.dtos.PlaceOrderResponse;
import com.optivem.eshop.backend.core.entities.Order;
import com.optivem.eshop.backend.core.entities.OrderStatus;
import com.optivem.eshop.backend.core.exceptions.NotExistValidationException;
import com.optivem.eshop.backend.core.exceptions.ValidationException;
import com.optivem.eshop.backend.core.repositories.OrderRepository;
import com.optivem.eshop.backend.core.services.external.ClockGateway;
import com.optivem.eshop.backend.core.services.external.ErpGateway;
import com.optivem.eshop.backend.core.services.external.TaxGateway;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.MonthDay;
import java.time.ZoneId;

@Service
public class OrderService {

    public static final MonthDay CANCELLATION_RESTRICTED_MONTH_DAY = MonthDay.of(12, 31);
    private static final LocalTime CANCELLATION_RESTRICTED_TIME_START = LocalTime.of(22, 0);
    private static final LocalTime CANCELLATION_RESTRICTED_TIME_END = LocalTime.of(22, 30);

    private final OrderRepository orderRepository;
    private final ErpGateway erpGateway;
    private final TaxGateway taxGateway;
    private final ClockGateway clockGateway;
    private final CouponService couponService;

    public OrderService(OrderRepository orderRepository, ErpGateway erpGateway, TaxGateway taxGateway, ClockGateway clockGateway, CouponService couponService) {
        this.orderRepository = orderRepository;
        this.erpGateway = erpGateway;
        this.taxGateway = taxGateway;
        this.clockGateway = clockGateway;
        this.couponService = couponService;
    }

    public PlaceOrderResponse placeOrder(PlaceOrderRequest request) {
        var sku = request.getSku();
        var quantity = request.getQuantity();
        var country = request.getCountry();
        var couponCode = request.getCouponCode();

        System.out.println("Placing order for SKU: " + sku + ", quantity: " + quantity + ", country: " + country);

        var orderTimestamp = clockGateway.getCurrentTime();
        var unitPrice = getUnitPrice(sku);
        var discountRate = getDiscountRate(couponCode);
        var taxRate = getTaxRate(country);

        var basePrice = unitPrice.multiply(BigDecimal.valueOf(quantity));
        var discountAmount = basePrice.multiply(discountRate);
        var subtotalPrice = basePrice.subtract(discountAmount);
        var taxAmount = subtotalPrice.multiply(taxRate);
        var totalPrice = subtotalPrice.add(taxAmount);

        var appliedCouponCode = discountRate.compareTo(BigDecimal.ZERO) > 0 ? couponCode : null;

        // Generate orderNumber from timestamp + random suffix
        var orderNumber = generateOrderNumber();

        var order = new Order(orderNumber, orderTimestamp, country,
                sku, quantity, unitPrice, basePrice,
                discountRate, discountAmount, subtotalPrice,
                taxRate, taxAmount, totalPrice, OrderStatus.PLACED,
                appliedCouponCode);

        orderRepository.save(order);

        // Increment coupon usage count if a coupon was applied
        if (appliedCouponCode != null) {
            couponService.incrementUsageCount(appliedCouponCode);
        }

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

    private BigDecimal getDiscountRate(String couponCode) {
        return couponService.getDiscount(couponCode);
    }

    private BigDecimal getTaxRate(String country) {
        var countryDetails = taxGateway.getTaxDetails(country);
        if (countryDetails.isEmpty()) {
            throw new ValidationException("country", "Country does not exist: " + country);
        }

        return countryDetails.get().getTaxRate();
    }

    public BrowseOrderHistoryResponse browseOrderHistory(String orderNumberFilter) {
        // Delegate filtering and sorting to database for better performance
        java.util.List<Order> orders;
        if (orderNumberFilter == null || orderNumberFilter.trim().isEmpty()) {
            orders = orderRepository.findAllByOrderByOrderTimestampDesc();
        } else {
            orders = orderRepository.findByOrderNumberContainingIgnoreCaseOrderByOrderTimestampDesc(orderNumberFilter.trim());
        }
        
        var items = orders.stream()
                .map(order -> {
                    var response = new BrowseOrderHistoryResponse.BrowseOrderHistoryItemResponse();
                    response.setOrderNumber(order.getOrderNumber());
                    response.setOrderTimestamp(order.getOrderTimestamp());
                    response.setSku(order.getSku());
                    response.setCountry(order.getCountry());
                    response.setQuantity(order.getQuantity());
                    response.setTotalPrice(order.getTotalPrice());
                    response.setStatus(order.getStatus());
                    response.setAppliedCouponCode(order.getAppliedCouponCode());
                    return response;
                })
                .collect(java.util.stream.Collectors.toList());
                
        var result = new BrowseOrderHistoryResponse();
        result.setOrders(items);
        return result;
    }

    public ViewOrderDetailsResponse getOrder(String orderNumber) {
        var optionalOrder = orderRepository.findByOrderNumber(orderNumber);

        if(optionalOrder.isEmpty()) {
            throw new NotExistValidationException("Order " + orderNumber + " does not exist.");
        }

        var order = optionalOrder.get();

        var response = new ViewOrderDetailsResponse();
        response.setOrderNumber(orderNumber);
        response.setOrderTimestamp(order.getOrderTimestamp());
        response.setSku(order.getSku());
        response.setQuantity(order.getQuantity());
        response.setUnitPrice(order.getUnitPrice());
        response.setBasePrice(order.getBasePrice());
        response.setDiscountRate(order.getDiscountRate());
        response.setDiscountAmount(order.getDiscountAmount());
        response.setSubtotalPrice(order.getSubtotalPrice());
        response.setTaxRate(order.getTaxRate());
        response.setTaxAmount(order.getTaxAmount());
        response.setTotalPrice(order.getTotalPrice());
        response.setStatus(order.getStatus());
        response.setCountry(order.getCountry());
        response.setAppliedCouponCode(order.getAppliedCouponCode());

        return response;
    }

    public void cancelOrder(String orderNumber) {
        if (orderNumber == null || orderNumber.trim().isEmpty()) {
            throw new ValidationException("Order number must not be empty");
        }

        var optionalOrder = orderRepository.findByOrderNumber(orderNumber);

        if(optionalOrder.isEmpty()) {
            throw new NotExistValidationException("Order " + orderNumber + " does not exist.");
        }

        var order = optionalOrder.get();

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ValidationException("Order has already been cancelled");
        }

        var now = LocalDateTime.ofInstant(clockGateway.getCurrentTime(), ZoneId.of("UTC"));
        var currentMonthDay = MonthDay.from(now);


        if (currentMonthDay.equals(CANCELLATION_RESTRICTED_MONTH_DAY)) {
            var currentTime = now.toLocalTime();

            if(!currentTime.isBefore(CANCELLATION_RESTRICTED_TIME_START) && 
                !currentTime.isAfter(CANCELLATION_RESTRICTED_TIME_END)) {
                throw new ValidationException("Order cancellation is not allowed on December 31st between 22:00 and 23:00");
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
    }

    private String generateOrderNumber() {
        var uuid = java.util.UUID.randomUUID().toString().toUpperCase();
        return "ORD-" + uuid;
    }
}
