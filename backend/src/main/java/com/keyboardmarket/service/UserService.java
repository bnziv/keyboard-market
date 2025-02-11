package com.keyboardmarket.service;

import org.springframework.stereotype.Service;

import com.keyboardmarket.model.User;
import com.keyboardmarket.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public User registerUser(User user) {
        if (userRepository.existsByEmailIgnoreCase(user.getEmail())) {
            throw new RuntimeException("Email '" + user.getEmail() + "' is already in use");
        }

        if (userRepository.existsByUsernameIgnoreCase(user.getUsername())) {
            throw new RuntimeException("Username '" + user.getUsername() + "' is already in use");
        }
        return userRepository.save(user);
    }
}
