package com.keyboardmarket.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.keyboardmarket.model.User;

public interface UserRepository extends MongoRepository<User, String> {

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByUsernameIgnoreCase(String username);

}
