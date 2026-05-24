package com.keyboardmarket.controller;

import com.keyboardmarket.model.GroupBuy;
import com.keyboardmarket.repository.GroupBuyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/groupbuys")
public class GroupBuyController {

    private final GroupBuyRepository groupBuyRepository;

    @GetMapping
    public ResponseEntity<List<GroupBuy>> getAll(
            @RequestParam(required = false) String status) {
        List<GroupBuy> result = (status != null)
                ? groupBuyRepository.findByStatus(status)
                : groupBuyRepository.findAll();
        return ResponseEntity.ok(result);
    }
}
