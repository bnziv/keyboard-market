package com.keyboardmarket.service;

import com.keyboardmarket.model.ChatMessage;
import com.keyboardmarket.repository.ChatMessageRepository;
import com.keyboardmarket.dto.ConversationDTO;
import com.keyboardmarket.dto.ConversationResult;
import com.keyboardmarket.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatMessageRepository chatMessageRepository;
    private final UserService userService;

    public ChatMessage saveMessage(ChatMessage message) {
        return chatMessageRepository.save(message);
    }

    public List<ChatMessage> getChatHistory(String userId1, String userId2) {
        return chatMessageRepository.findByParticipants(userId1, userId2);
    }

    public List<ConversationDTO> getUserConversations(String userId) {
        List<ConversationResult> conversations = chatMessageRepository.findUserConversations(userId);
        
        return conversations.stream()
            .map(conv -> {
                User otherUser = userService.getUserById(conv.getId());
                return new ConversationDTO(
                    otherUser.getId(),
                    otherUser.getUsername(),
                    conv.getLastMessage(),
                    conv.getTimestamp()
                );
            })
            .collect(Collectors.toList());
    }
}
