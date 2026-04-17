package com.example.salesstock.controller;

import com.example.salesstock.dto.AnalyticsDto;
import com.example.salesstock.dto.DashboardDto;
import com.example.salesstock.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "http://localhost:5173")
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
}
