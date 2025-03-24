package com.keyboardmarket.controller;

import com.keyboardmarket.dto.ProfileResponse;
import com.keyboardmarket.model.User;
import com.keyboardmarket.service.ListingService;
import com.keyboardmarket.service.UserService;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;
    private final ListingService listingService;
    
    @GetMapping("/username/{username}")
    public ResponseEntity<User> getUser(@PathVariable String username) {
        User user = userService.getUserByUsername(username);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<User> getUserByEmail(@PathVariable String email) {
        User user = userService.getUserByEmail(email);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        User user = userService.getUserById(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }

    @GetMapping("/profile/{username}")
    public ResponseEntity<ProfileResponse> getProfile(@PathVariable String username) {
        User user = userService.getUserByUsername(username);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        ProfileResponse profile = new ProfileResponse();
        profile.setId(user.getId());
        profile.setUsername(user.getUsername());
        profile.setDateJoined(user.getDateJoined());
        profile.setTotalListings(listingService.countListingsByUserId(user.getId()));
        // profile.setRating(listingService.getRatingByUserId(user.getId()));
        // profile.setReviewCount(reviewService.countReviewsByUserId(user.getId()));
        // profile.setFavoriteCount(favoriteService.countFavoritesByUserId(user.getId()));
        profile.setRating(0.0);
        profile.setReviewCount(0);
        profile.setFavoriteCount(0);
        return ResponseEntity.ok(profile);
    }
}
