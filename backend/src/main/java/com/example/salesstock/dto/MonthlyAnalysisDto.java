package com.example.salesstock.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MonthlyAnalysisDto {
    private int month; // 1 - 12
    private String monthName; // "Jan", "Feb", etc.
    private BigDecimal revenue;
    private Long quantitySold;
    private Long invoiceCount;
    private String topProductName;
    private Long topProductQuantity;
    private BigDecimal topProductRevenue;
}
