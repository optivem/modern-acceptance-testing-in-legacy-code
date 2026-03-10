package com.optivem.eshop.backend.core.services;

import com.optivem.eshop.backend.core.dtos.SubmitReviewRequest;
import com.optivem.eshop.backend.core.dtos.SubmitReviewResponse;
import com.optivem.eshop.backend.core.entities.OrderStatus;
import com.optivem.eshop.backend.core.entities.Review;
import com.optivem.eshop.backend.core.exceptions.NotExistValidationException;
import com.optivem.eshop.backend.core.exceptions.ValidationException;
import com.optivem.eshop.backend.core.repositories.OrderRepository;
import com.optivem.eshop.backend.core.repositories.ReviewRepository;
import com.optivem.eshop.backend.core.services.external.ErpGateway;
import org.springframework.stereotype.Service;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final ErpGateway erpGateway;

    public ReviewService(ReviewRepository reviewRepository, OrderRepository orderRepository, ErpGateway erpGateway) {
        this.reviewRepository = reviewRepository;
        this.orderRepository = orderRepository;
        this.erpGateway = erpGateway;
    }

    public SubmitReviewResponse submitReview(SubmitReviewRequest request) {
        var orderNumber = request.getOrderNumber();

        var optionalOrder = orderRepository.findByOrderNumber(orderNumber);

        if (optionalOrder.isEmpty()) {
            throw new NotExistValidationException("Order " + orderNumber + " does not exist.");
        }

        var order = optionalOrder.get();

        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new ValidationException("Order has not been delivered yet");
        }

        var existingReview = reviewRepository.findByOrderNumber(orderNumber);
        if (existingReview.isPresent()) {
            throw new ValidationException("A review has already been submitted for this order");
        }

        var rating = request.getRating();
        if (rating == null || rating < 1 || rating > 5) {
            throw new ValidationException("Rating must be between 1 and 5");
        }

        var comment = request.getComment();
        if (comment != null && comment.length() > 500) {
            throw new ValidationException("Comment must not exceed 500 characters");
        }

        var sku = order.getSku();
        var optionalProduct = erpGateway.getProductDetails(sku);
        if (optionalProduct.isPresent()) {
            var product = optionalProduct.get();
            if (product.getReviewable() != null && !product.getReviewable()) {
                throw new ValidationException("Product is not reviewable");
            }
        }

        var reviewId = generateReviewId();

        var review = new Review(reviewId, orderNumber, request.getRating(), request.getComment());
        reviewRepository.save(review);

        var response = new SubmitReviewResponse();
        response.setReviewId(reviewId);
        return response;
    }

    private String generateReviewId() {
        var uuid = java.util.UUID.randomUUID().toString().toUpperCase();
        return "REV-" + uuid;
    }
}
