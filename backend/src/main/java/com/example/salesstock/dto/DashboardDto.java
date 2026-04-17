package com.example.salesstock.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

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
}
