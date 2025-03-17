package com.keyboardmarket.dto;

import lombok.Data;
import java.time.Instant;

@Data
public class ListingDetailsResponse {
    private String id;
    private String title;
    private Double price;
    private boolean offers;
    private String description;
    private String condition;
    private String imageUrl;
    private SellerInfo seller;
    private Instant createdOn;

    @Data
    public static class SellerInfo {
        private String id;
        private String username;
        private Instant dateJoined;
        private long totalListings;
    }
}