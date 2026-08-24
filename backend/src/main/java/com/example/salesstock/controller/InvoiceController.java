package com.example.salesstock.controller;

import com.example.salesstock.dto.InvoiceDto;
import com.example.salesstock.dto.PagedResponse;
import com.example.salesstock.entity.Invoice;
import com.example.salesstock.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<PagedResponse<Invoice>> getAll(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "") String paymentType,
            @RequestParam(defaultValue = "") String from,
            @RequestParam(defaultValue = "") String to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "invoiceDate") String sort) {
        return ResponseEntity.ok(invoiceService.getAll(search, status, paymentType, from, to, page, size, sort));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getById(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.getById(id));
    }

    @PostMapping
    public ResponseEntity<Invoice> create(@Valid @RequestBody InvoiceDto dto) {
        return ResponseEntity.ok(invoiceService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Invoice> update(@PathVariable Long id, @Valid @RequestBody InvoiceDto dto) {
        return ResponseEntity.ok(invoiceService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        invoiceService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/cheque-status")
    public ResponseEntity<Invoice> updateChequeStatus(@PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        Invoice.ChequeStatus status = Invoice.ChequeStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(invoiceService.updateChequeStatus(id, status));
    }
}
