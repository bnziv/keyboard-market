package com.keyboardmarket.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.keyboardmarket.model.User;

public interface UserRepository extends MongoRepository<User, String> {

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByUsernameIgnoreCase(String username);

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByUsernameIgnoreCase(String username);
}
