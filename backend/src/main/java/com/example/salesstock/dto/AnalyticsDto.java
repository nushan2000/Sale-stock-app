package com.example.salesstock.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class AnalyticsDto {
    private BigDecimal salesRevenue;
    private BigDecimal totalCost;
    private BigDecimal grossProfit;
    private BigDecimal totalExpenses;
    private BigDecimal netProfit;
    private BigDecimal totalRefunds;
    private long invoiceCount;
    private long refundCount;
}
