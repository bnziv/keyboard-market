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

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {
    private final UserService userService;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> registerUser(@Valid @RequestBody User user, HttpServletResponse response) {
        String token = userService.registerUser(user);
        addJwtCookie(response, token);
        
        Map<String, String> responseBody = new HashMap<>();
        responseBody.put("message", "Registration successful");
        return ResponseEntity.ok(responseBody);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> loginUser(@RequestBody LoginRequest loginRequest, HttpServletResponse response) {
        String token = userService.loginUser(loginRequest);
        addJwtCookie(response, token);
        
        String userId = jwtUtil.getUserIdFromToken(token);
        User user = userService.getUserById(userId);
        Map<String, String> responseBody = new HashMap<>();
        responseBody.put("id", user.getId());
        responseBody.put("username", user.getUsername());
        
        return ResponseEntity.ok(responseBody);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("jwt", null);
        cookie.setMaxAge(0);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setAttribute("SameSite", "None");
        response.addCookie(cookie);
        
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<?> validateToken(@CookieValue(name = "jwt", required = false) String token) {
        if (token == null || !jwtUtil.validateToken(token)) {
            return ResponseEntity.status(401).build();
        }
        String userId = jwtUtil.getUserIdFromToken(token);
        User user = userService.getUserById(userId);
        Map<String, String> responseBody = new HashMap<>();
        responseBody.put("id", user.getId());
        responseBody.put("username", user.getUsername());
        
        return ResponseEntity.ok(responseBody);
    }

    private void addJwtCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("jwt", token);
        cookie.setMaxAge(24 * 60 * 60); // 24 hours
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setAttribute("SameSite", "None");
        response.addCookie(cookie);
    }
}
