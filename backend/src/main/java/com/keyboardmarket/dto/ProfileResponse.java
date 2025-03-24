package com.keyboardmarket.dto;

import java.time.Instant;
import lombok.Data;

@Data
public class ProfileResponse {
    private String id;
    private String username;
    private Instant dateJoined;
    private long totalListings;
    private double rating;
    private long reviewCount;
    private long favoriteCount;
}
