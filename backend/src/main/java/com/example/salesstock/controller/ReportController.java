package com.example.salesstock.controller;

import com.example.salesstock.dto.AnalyticsDto;
import com.example.salesstock.dto.DashboardDto;
import com.example.salesstock.dto.MonthlyAnalysisDto;
import com.example.salesstock.dto.PagedResponse;
import com.example.salesstock.dto.TopProductDto;
import com.example.salesstock.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDto> getDashboard() {
        return ResponseEntity.ok(reportService.getDashboard());
    }

    @GetMapping("/analytics")
    public ResponseEntity<AnalyticsDto> getAnalytics(
            @RequestParam(defaultValue = "") String from,
            @RequestParam(defaultValue = "") String to) {
        return ResponseEntity.ok(reportService.getAnalytics(from, to));
    }

    @GetMapping("/top-products")
    public ResponseEntity<PagedResponse<TopProductDto>> getTopProducts(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false, defaultValue = "revenue") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reportService.getTopProducts(from, to, year, month, sortBy, page, size));
    }

    @GetMapping("/monthly-analysis")
    public ResponseEntity<List<MonthlyAnalysisDto>> getMonthlyAnalysis(
            @RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(reportService.getMonthlyAnalysis(year));
    }
}
