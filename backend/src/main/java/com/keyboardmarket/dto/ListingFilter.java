package com.keyboardmarket.dto;

import lombok.Data;

@Data
public class ListingFilter {
    private Double minPrice;
    private Double maxPrice;
    private Boolean offers;
    private String condition;
    private String title;
    private String sortBy = "createdOn";
    private String sortDirection = "desc";
    private int page = 0;
    private int size = 12;
} 