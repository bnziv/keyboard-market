package com.keyboardmarket.controller;

import com.keyboardmarket.dto.ListingRequest;
import com.keyboardmarket.dto.ListingDetailsResponse;
import com.keyboardmarket.model.Listing;
import com.keyboardmarket.model.User;
import com.keyboardmarket.service.ListingService;
import com.keyboardmarket.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/listings")
public class ListingController {
    private final ListingService listingService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<Listing> createListing(@Valid @RequestBody ListingRequest listingRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();
        Listing result = listingService.createListing(listingRequest, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @GetMapping("/all")
    public List<Listing> getAllListings() {
        return listingService.getAllListings();
    }

    @GetMapping("/search/title")
    public List<Listing> searchListingsByTitle(String title) {
        return listingService.searchListingsByTitle(title);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Listing> getListingById(@PathVariable String id) {
        Listing listing = listingService.getListingById(id);
        if (listing == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(listing);
    }

    @GetMapping("/details/{id}")
    public ResponseEntity<ListingDetailsResponse> getListingDetailsById(@PathVariable String id) {
        Listing listing = listingService.getListingById(id);
        if (listing == null) {
            return ResponseEntity.notFound().build();
        }

        User seller = userService.getUserById(listing.getUserId());
        if (seller == null) {
            return ResponseEntity.notFound().build();
        }

        ListingDetailsResponse response = new ListingDetailsResponse();
        response.setId(listing.getId());
        response.setTitle(listing.getTitle());
        response.setPrice(listing.getPrice());
        response.setOffers(listing.isOffers());
        response.setDescription(listing.getDescription());
        response.setCondition(listing.getCondition());
        response.setImageUrl(listing.getImageUrl());
        response.setCreatedOn(listing.getCreatedOn());

        ListingDetailsResponse.SellerInfo sellerInfo = new ListingDetailsResponse.SellerInfo();
        sellerInfo.setId(seller.getId());
        sellerInfo.setUsername(seller.getUsername());
        sellerInfo.setDateJoined(seller.getDateJoined());
        sellerInfo.setTotalListings(listingService.countListingsByUserId(seller.getId()));
        response.setSeller(sellerInfo);

        return ResponseEntity.ok(response);
    }
}
