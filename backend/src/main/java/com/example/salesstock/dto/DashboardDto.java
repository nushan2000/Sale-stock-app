package com.example.salesstock.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class DashboardDto {
    private BigDecimal todaySales;
    private BigDecimal todayExpenses;
    private BigDecimal totalReceivable; // total outstanding debt
    private BigDecimal totalPayable; // total outstanding supplier debt
    private long totalCustomers;
    private long totalSuppliers;
    private long totalProducts;
    private long lowStockCount;
    private long pendingInvoices;

    private List<DailyPointDto> salesTrend; // last 14 days, gap-filled with zero
    private List<TopProductDto> topProducts; // top 5 by revenue, last 30 days
    private List<LowStockItemDto> lowStockItems; // worst 5 by stock-vs-minimum
    private List<RecentSaleDto> recentSales; // latest 5 invoices/quick-sales
}
