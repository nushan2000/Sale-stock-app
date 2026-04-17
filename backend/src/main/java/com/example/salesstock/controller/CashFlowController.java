package com.example.salesstock.controller;

import com.example.salesstock.dto.PagedResponse;
import com.example.salesstock.entity.CashFlow;
import com.example.salesstock.repository.CashFlowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cashflow")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class CashFlowController {

    private final CashFlowRepository cashFlowRepository;

    @GetMapping
    public ResponseEntity<PagedResponse<CashFlow>> getAll(
            @RequestParam(defaultValue = "") String type,
            @RequestParam(defaultValue = "") String category,
            @RequestParam(defaultValue = "") String from,
            @RequestParam(defaultValue = "") String to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        CashFlow.FlowType ft = type.isEmpty() ? null : CashFlow.FlowType.valueOf(type);
        CashFlow.FlowCategory fc = category.isEmpty() ? null : CashFlow.FlowCategory.valueOf(category);
        LocalDate fromDate = from.isEmpty() ? null : LocalDate.parse(from);
        LocalDate toDate = to.isEmpty() ? null : LocalDate.parse(to);
        Page<CashFlow> result = cashFlowRepository.filter(ft, fc, fromDate, toDate,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "transactionDate")));
        return ResponseEntity.ok(new PagedResponse<>(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages(), result.isLast()));
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, BigDecimal>> getSummary(
            @RequestParam(defaultValue = "") String from,
            @RequestParam(defaultValue = "") String to) {
        LocalDate fromDate = from.isEmpty() ? LocalDate.now().withDayOfMonth(1) : LocalDate.parse(from);
        LocalDate toDate = to.isEmpty() ? LocalDate.now() : LocalDate.parse(to);
        BigDecimal credits = cashFlowRepository.sumCredits(fromDate, toDate);
        BigDecimal debits = cashFlowRepository.sumDebits(fromDate, toDate);
        Map<String, BigDecimal> summary = new HashMap<>();
        summary.put("totalCredits", credits);
        summary.put("totalDebits", debits);
        summary.put("netBalance", credits.subtract(debits));
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/export")
    public ResponseEntity<List<CashFlow>> exportAll(
            @RequestParam(defaultValue = "") String from,
            @RequestParam(defaultValue = "") String to) {
        LocalDate fromDate = from.isEmpty() ? LocalDate.now().withDayOfMonth(1) : LocalDate.parse(from);
        LocalDate toDate = to.isEmpty() ? LocalDate.now() : LocalDate.parse(to);
        return ResponseEntity.ok(cashFlowRepository.findAllForExport(fromDate, toDate));
    }


}
