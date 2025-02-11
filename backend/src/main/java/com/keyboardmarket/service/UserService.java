package com.keyboardmarket.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.keyboardmarket.model.User;
import com.keyboardmarket.repository.UserRepository;
import com.mongodb.DuplicateKeyException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User registerUser(User user) {
        if (userRepository.existsByEmailIgnoreCase(user.getEmail())) {
            throw new RuntimeException("Email '" + user.getEmail() + "' is already in use");
        }

        if (userRepository.existsByUsernameIgnoreCase(user.getUsername())) {
            throw new RuntimeException("Username '" + user.getUsername() + "' is already in use");
        }

        String hashedPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(hashedPassword);
        try {
            return userRepository.save(user);
        } catch (DuplicateKeyException e) { // Edge case if it passes the previous checks
            throw new RuntimeException("User already exists");
        }
    }
}
