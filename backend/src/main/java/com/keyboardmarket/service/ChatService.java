package com.keyboardmarket.service;

import com.keyboardmarket.model.ChatMessage;
import com.keyboardmarket.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatMessageRepository chatMessageRepository;

    public ChatMessage saveMessage(ChatMessage message) {
        return chatMessageRepository.save(message);
    }

    public List<ChatMessage> getChatHistory(String userId1, String userId2) {
        return chatMessageRepository.findByParticipants(userId1, userId2);
    }
}
