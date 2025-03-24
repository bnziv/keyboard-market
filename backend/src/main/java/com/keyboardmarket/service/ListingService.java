package com.keyboardmarket.service;

import java.util.List;

import com.keyboardmarket.dto.ListingRequest;
import com.keyboardmarket.dto.ListingFilter;
import com.keyboardmarket.model.Listing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import com.keyboardmarket.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageImpl;

@Service
@RequiredArgsConstructor
public class ListingService {
    private final ListingRepository listingRepository;
    private final MongoTemplate mongoTemplate;

    public Listing createListing(ListingRequest listingRequest, String userId) {
        Listing listing = new Listing();
        listing.setTitle(listingRequest.getTitle());
        listing.setDescription(listingRequest.getDescription());
        if (listingRequest.getPrice() != null) {
            listing.setPrice(listingRequest.getPrice());
        }
        listing.setCondition(listingRequest.getCondition());
        listing.setOffers(listingRequest.isOffers());
        if (listingRequest.getImageUrl() != null && !listingRequest.getImageUrl().isBlank()) {
            listing.setImageUrl(listingRequest.getImageUrl());
        }
        listing.setUserId(userId);

        return listingRepository.save(listing);
    }

    public List<Listing> searchListingsByTitle(String title) {
        return listingRepository.findByTitleContainingIgnoreCase(title);
    }

    public List<Listing> getAllListings() {
        return listingRepository.findAll();
    }

    public Listing getListingById(String id) {
        return listingRepository.findById(id).orElse(null);
    }

    public long countListingsByUserId(String userId) {
        return listingRepository.countByUserId(userId);
    }

    public List<Listing> getListingsByUserId(String userId) {
        return listingRepository.findByUserId(userId);
    }

    public Page<Listing> getFilteredListings(ListingFilter filter) {
        Criteria criteria = new Criteria();
        
        if (filter.getMinPrice() != null && filter.getMaxPrice() != null) {
            criteria.and("price").gte(filter.getMinPrice()).lte(filter.getMaxPrice());
        } else if (filter.getMinPrice() != null) {
            criteria.and("price").gte(filter.getMinPrice());
        } else if (filter.getMaxPrice() != null) {
            criteria.and("price").lte(filter.getMaxPrice());
        }

        if (filter.getOffers() != null) {
            criteria.and("offers").is(filter.getOffers());
        }

        if (filter.getCondition() != null && !filter.getCondition().isEmpty()) {
            criteria.and("condition").is(filter.getCondition());
        }

        if (filter.getTitle() != null && !filter.getTitle().isEmpty()) {
            criteria.and("title").regex(filter.getTitle(), "i");
        }

        Sort sort = Sort.by(
            filter.getSortDirection().equalsIgnoreCase("asc") ? 
            Sort.Direction.ASC : Sort.Direction.DESC,
            filter.getSortBy()
        );

        Pageable pageable = PageRequest.of(filter.getPage(), filter.getSize(), sort);
        
        Query countQuery = new Query(criteria);
        long total = mongoTemplate.count(countQuery, Listing.class);

        Query fetchQuery = new Query(criteria).with(pageable);
        List<Listing> listings = mongoTemplate.find(fetchQuery, Listing.class);

        return new PageImpl<>(listings, pageable, total);
    }
}
