package com.example.salesstock.controller;

import com.example.salesstock.dto.TillTransactionDto;
import com.example.salesstock.entity.TillTransaction;
import com.example.salesstock.service.TillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shifts/{shiftId}/till")
@RequiredArgsConstructor
public class TillController {

    private final TillService tillService;

    @GetMapping
    public ResponseEntity<List<TillTransaction>> getForShift(@PathVariable Long shiftId) {
        return ResponseEntity.ok(tillService.getForShift(shiftId));
    }

    @PostMapping
    public ResponseEntity<TillTransaction> add(@PathVariable Long shiftId, @Valid @RequestBody TillTransactionDto dto) {
        return ResponseEntity.ok(tillService.add(shiftId, dto));
    }
}
