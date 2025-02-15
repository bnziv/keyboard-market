package com.keyboardmarket.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.keyboardmarket.dto.LoginRequest;
import com.keyboardmarket.model.User;
import com.keyboardmarket.security.JwtUtil;
import com.keyboardmarket.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {
    private final UserService userService;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> registerUser(@Valid @RequestBody User user) {
        Map<String, String> response = new HashMap<>();
        response.put("token", userService.registerUser(user));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> loginUser(@RequestBody LoginRequest loginRequest) {
        Map<String, String> response = new HashMap<>();
        response.put("token", userService.loginUser(loginRequest));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> validateToken(@RequestHeader(value = "Authorization", required = false) String header) {
        if (header == null || !header.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        String token = header.substring(7);
        boolean isValid = jwtUtil.validateToken(token);
        
        return isValid ? ResponseEntity.ok().build() : ResponseEntity.status(401).build();
    }
}
