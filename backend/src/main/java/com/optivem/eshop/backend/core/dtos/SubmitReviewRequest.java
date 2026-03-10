package com.optivem.eshop.backend.core.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubmitReviewRequest {
    @NotBlank(message = "Order number must not be empty")
    private String orderNumber;

    private Integer rating;

    @NotBlank(message = "Comment must not be empty")
    private String comment;
}
