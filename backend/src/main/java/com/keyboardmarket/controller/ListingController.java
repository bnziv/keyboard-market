package com.keyboardmarket.controller;

import com.keyboardmarket.dto.ListingRequest;
import com.keyboardmarket.dto.ListingDetailsResponse;
import com.keyboardmarket.dto.ListingFilter;
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
import java.util.Map;
import java.util.HashMap;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;

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

    @GetMapping("/username/{username}")
    public ResponseEntity<List<Listing>> getListingsByUsername(@PathVariable String username) {
        User user = userService.getUserByUsername(username);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        List<Listing> listings = listingService.getListingsByUserId(user.getId());
        return ResponseEntity.ok(listings);
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
        if (listing.getPrice() != null) {
            response.setPrice(listing.getPrice());
        }
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

    @GetMapping("/filtered")
    public ResponseEntity<Map<String, Object>> getFilteredListings(
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Boolean offers,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) String title,
            @RequestParam(defaultValue = "createdOn") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        
        ListingFilter filter = new ListingFilter();
        filter.setMinPrice(minPrice);
        filter.setMaxPrice(maxPrice);
        filter.setOffers(offers);
        filter.setCondition(condition);
        filter.setTitle(title);
        filter.setSortBy(sortBy);
        filter.setSortDirection(sortDirection);
        filter.setPage(page);
        filter.setSize(size);

        Page<Listing> pageResult = listingService.getFilteredListings(filter);

        Map<String, Object> response = new HashMap<>();
        response.put("listings", pageResult.getContent());
        response.put("currentPage", pageResult.getNumber());
        response.put("totalItems", pageResult.getTotalElements());
        response.put("totalPages", pageResult.getTotalPages());

        return ResponseEntity.ok(response);
    }
}
