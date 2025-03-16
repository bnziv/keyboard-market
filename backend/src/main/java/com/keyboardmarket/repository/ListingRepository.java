package com.keyboardmarket.repository;

import com.keyboardmarket.model.Listing;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ListingRepository extends MongoRepository<Listing, String> {
    List<Listing> findByTitleContainingIgnoreCase(String title);
    long countByUserId(String userId);
}
