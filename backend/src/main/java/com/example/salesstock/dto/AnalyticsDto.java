package com.example.salesstock.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

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

    private List<DailyPointDto> dailyTrend; // revenue per day across [from, to], gap-filled
    private List<TopProductDto> topProducts; // top 5 by revenue within [from, to]
    private ForecastDto forecast; // simple trend projection off dailyTrend
}
