package com.keyboardmarket.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ListingRequest {

    @NotBlank(message = "Title cannot be empty")
    private String title;

    @Size(max = 1000, message = "Description cannot be longer than 1000 characters")
    private String description;

    @NotBlank(message = "Price cannot be empty")
    private String price;
    
    private String imageUrl;
}
