package com.keyboardmarket.repository;

import com.keyboardmarket.model.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {
    List<ChatMessage> findBySenderIdAndReceiverIdOrReceiverIdAndSenderIdOrderByTimestampDesc(
        String senderId, String receiverId, String receiverId2, String senderId2);

    @Query("{ $or: [ { $and: [ { senderId: ?0 }, { receiverId: ?1 } ] }, { $and: [ { senderId: ?1 }, { receiverId: ?0 } ] } ] }")
    List<ChatMessage> findByParticipants(String userId1, String userId2);
}
