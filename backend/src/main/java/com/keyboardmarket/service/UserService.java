package com.keyboardmarket.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.keyboardmarket.dto.LoginRequest;
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

    public String loginUser(LoginRequest loginRequest) {
        User user = userRepository.findByUsernameIgnoreCase(loginRequest.getIdentifier())
            .orElseGet(() -> userRepository.findByEmailIgnoreCase(loginRequest.getIdentifier())
                    .orElseThrow(() -> new RuntimeException("User not found")));
        
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new RuntimeException("Incorrect password");
        }

        return user.getId();
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsernameIgnoreCase(username).orElse(null);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email).orElse(null);
    }

    public User getUserById(String id) {
        return userRepository.findById(id).orElse(null);
    }
}
