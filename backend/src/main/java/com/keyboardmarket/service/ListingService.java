package com.keyboardmarket.service;

import java.util.List;
import com.keyboardmarket.model.Listing;
import org.springframework.stereotype.Service;
import com.keyboardmarket.repository.ListingRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ListingService {
    private final ListingRepository listingRepository;

    public Listing createListing(Listing listing) {
        return listingRepository.save(listing);
    }

    public List<Listing> searchListingsByTitle(String title) {
        return listingRepository.findByTitleRegex(title);
    }

    public List<Listing> getAllListings() {
        return listingRepository.findAll();
    }
}
