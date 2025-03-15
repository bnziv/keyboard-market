package com.keyboardmarket.service;

import java.util.List;

import com.keyboardmarket.dto.ListingRequest;
import com.keyboardmarket.model.Listing;
import org.springframework.stereotype.Service;
import com.keyboardmarket.repository.ListingRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ListingService {
    private final ListingRepository listingRepository;

    public Listing createListing(ListingRequest listingRequest, String userId) {
        Listing listing = new Listing();
        listing.setTitle(listingRequest.getTitle());
        listing.setDescription(listingRequest.getDescription());
        listing.setPrice(listingRequest.getPrice());
        listing.setCondition(listingRequest.getCondition());
        if (listingRequest.getImageUrl() != null && !listingRequest.getImageUrl().isBlank()) {
            listing.setImageUrl(listingRequest.getImageUrl());
        }
        listing.setUserId(userId);

        return listingRepository.save(listing);
    }

    public List<Listing> searchListingsByTitle(String title) {
        return listingRepository.findByTitleRegex(title);
    }

    public List<Listing> getAllListings() {
        return listingRepository.findAll();
    }
}
