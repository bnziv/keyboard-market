package com.keyboardmarket.controller;

import com.keyboardmarket.model.ChatMessage;
import com.keyboardmarket.dto.ConversationDTO;
import com.keyboardmarket.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.List;

@Controller
@RequiredArgsConstructor
@RequestMapping("/api/chat")
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessage message) {
        ChatMessage savedMessage = chatService.saveMessage(message);
        
        // Send to receiver
        messagingTemplate.convertAndSendToUser(
            message.getReceiverId(),
            "/topic/messages",
            savedMessage
        );
        
        // Send back to sender
        messagingTemplate.convertAndSendToUser(
            message.getSenderId(),
            "/topic/messages",
            savedMessage
        );
    }

    @GetMapping("/history")
    @ResponseBody
    public ResponseEntity<List<ChatMessage>> getChatHistory(
        @RequestParam String userId1,
        @RequestParam String userId2,
        Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        String requestingUserId = (String) authentication.getPrincipal();
        if (!requestingUserId.equals(userId1) && !requestingUserId.equals(userId2)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(chatService.getChatHistory(userId1, userId2));
    }

    @GetMapping("/conversations/{userId}")
    @ResponseBody
    public ResponseEntity<List<ConversationDTO>> getUserConversations(
        @PathVariable String userId,
        Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        String requestingUserId = (String) authentication.getPrincipal();
        if (!requestingUserId.equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(chatService.getUserConversations(userId));
    }
}
