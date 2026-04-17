package com.example.salesstock.controller;

import com.example.salesstock.dto.PagedResponse;
import com.example.salesstock.dto.RefundDto;
import com.example.salesstock.entity.Refund;
import com.example.salesstock.service.RefundService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/refunds")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;

    @GetMapping
    public ResponseEntity<PagedResponse<Refund>> getAll(
            @RequestParam(defaultValue = "") String from,
            @RequestParam(defaultValue = "") String to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(refundService.getAll(from, to, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Refund> getById(@PathVariable Long id) {
        return ResponseEntity.ok(refundService.getById(id));
    }

    @PostMapping
    public ResponseEntity<Refund> create(@Valid @RequestBody RefundDto dto) {
        return ResponseEntity.ok(refundService.create(dto));
    }
}
