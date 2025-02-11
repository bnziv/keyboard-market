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
            throw new RuntimeException("User with email '" + user.getEmail() + "'' already exists");
        }

        if (userRepository.existsByUsernameIgnoreCase(user.getUsername())) {
            throw new RuntimeException("User with username '" + user.getUsername() + "'' already exists");
        }
        return userRepository.save(user);
    }
}
