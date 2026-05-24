package com.keyboardmarket.repository;

import com.keyboardmarket.model.GroupBuy;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface GroupBuyRepository extends MongoRepository<GroupBuy, String> {
    List<GroupBuy> findByStatus(String status);
}
