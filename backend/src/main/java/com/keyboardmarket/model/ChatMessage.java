package com.keyboardmarket.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Data
@Document(collection = "messages")
public class ChatMessage {
    @Id
    private String id;
    private String senderId;
    private String receiverId;
    private String content;
    private Instant timestamp;
    private boolean read;

    public ChatMessage() {
        this.timestamp = Instant.now();
        this.read = false;
    }
}
