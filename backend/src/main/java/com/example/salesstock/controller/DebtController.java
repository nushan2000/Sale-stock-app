package com.example.salesstock.controller;

import com.example.salesstock.dto.DebtDto;
import com.example.salesstock.dto.DebtPaymentDto;
import com.example.salesstock.dto.PagedResponse;
import com.example.salesstock.entity.Debt;
import com.example.salesstock.service.DebtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/debts")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class DebtController {

    private final DebtService debtService;

    @GetMapping
    public ResponseEntity<PagedResponse<Debt>> getAll(
            @RequestParam(required = false) Long customerId,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(debtService.getAll(customerId, status, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DebtDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(debtService.toDto(debtService.getById(id)));
    }

    @PostMapping("/pay")
    public ResponseEntity<DebtDto> payDebt(@Valid @RequestBody DebtPaymentDto dto) {
        return ResponseEntity.ok(debtService.toDto(debtService.payDebt(dto)));
    }
}
