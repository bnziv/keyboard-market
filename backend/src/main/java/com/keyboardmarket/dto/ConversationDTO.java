package com.keyboardmarket.dto;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ConversationDTO {
    private String userId;
    private String username;
    private String lastMessage;
    private Instant timestamp;
}