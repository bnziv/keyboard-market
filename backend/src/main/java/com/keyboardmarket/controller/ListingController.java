package com.keyboardmarket.controller;

import java.util.List;
import com.keyboardmarket.model.Listing;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RestController;
import com.keyboardmarket.service.ListingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/listings")
public class ListingController {
    private final ListingService listingService;

    @PostMapping
    public Listing createListing(@Valid @RequestBody Listing listing) {
        return listingService.createListing(listing);
    }

    @GetMapping("/all")
    public List<Listing> getAllListings() {
        return listingService.getAllListings();
    }

    @GetMapping("/search/title")
    public List<Listing> searchListingsByTitle(String title) {
        return listingService.searchListingsByTitle(title);
    }
}
