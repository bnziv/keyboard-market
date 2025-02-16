package com.keyboardmarket.model;

import java.time.Instant;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Document(collection = "listings")
@Data
public class Listing {

    @Id
    private String id;

    @NotBlank(message = "Title cannot be empty")
    private String title;

    @Size(max = 1000, message = "Description cannot be longer than 1000 characters")
    private String description;

    @NotBlank(message = "Price cannot be empty")
    private String price;

    private String imageUrl;

    private String userId;

    @CreatedDate
    private Instant createdOn;
}
