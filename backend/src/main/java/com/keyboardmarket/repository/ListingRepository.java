package com.keyboardmarket.repository;

import com.keyboardmarket.model.Listing;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface ListingRepository extends MongoRepository<Listing, String> {

    List<Listing> findByTitleRegex(String title);
}
