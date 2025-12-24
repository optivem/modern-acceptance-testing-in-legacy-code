package com.optivem.eshop.backend.core.services.external;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.optivem.eshop.backend.core.dtos.external.ProductDetailsResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Optional;


@Service
public class ErpGateway {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    
    @Value("${erp.url}")
    private String erpUrl;

    public Optional<ProductDetailsResponse> getProductDetails(String sku) {
        try {
            var httpClient = HttpClient.newBuilder()
                    .connectTimeout(java.time.Duration.ofSeconds(10))
                    .build();
                    
            var url = erpUrl + "/api/products/" + sku;
            var request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(java.time.Duration.ofSeconds(10))
                    .GET()
                    .build();
                    
            var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 404) {
                return Optional.empty();  // Product not found
            }

            if (response.statusCode() != 200) {
                throw new RuntimeException("ERP API returned status " + response.statusCode() + 
                        " for SKU: " + sku + ". URL: " + url + ". Response: " + response.body());
            }

            var result = OBJECT_MAPPER.readValue(response.body(), ProductDetailsResponse.class);
            return Optional.of(result);
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch product details for SKU: " + sku +
                    " from URL: " + erpUrl + "/products/" + sku +
                    ". Error: " + e.getClass().getSimpleName() + ": " + e.getMessage(), e);
        }
    }
}
