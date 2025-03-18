package com.keyboardmarket.dto;

import java.time.Instant;

import lombok.Data;

@Data
public class ConversationResult {
    private String id;
    private String lastMessage;
    private Instant timestamp;
} 