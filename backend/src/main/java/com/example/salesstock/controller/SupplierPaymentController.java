package com.example.salesstock.controller;

import com.example.salesstock.dto.SupplierPaymentDto;
import com.example.salesstock.entity.SupplierPayment;
import com.example.salesstock.service.SupplierPaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers/{supplierId}/payments")
@RequiredArgsConstructor
public class SupplierPaymentController {

    private final SupplierPaymentService supplierPaymentService;

    @GetMapping
    public ResponseEntity<List<SupplierPayment>> getForSupplier(@PathVariable Long supplierId) {
        return ResponseEntity.ok(supplierPaymentService.getForSupplier(supplierId));
    }

    @PostMapping
    public ResponseEntity<SupplierPayment> pay(@PathVariable Long supplierId,
            @Valid @RequestBody SupplierPaymentDto dto) {
        return ResponseEntity.ok(supplierPaymentService.pay(supplierId, dto));
    }
}
