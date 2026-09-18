package com.example.salesstock.service;

import com.example.salesstock.dto.AnalyticsDto;
import com.example.salesstock.dto.DailyPointDto;
import com.example.salesstock.dto.DashboardDto;
import com.example.salesstock.dto.ForecastDto;
import com.example.salesstock.dto.LowStockItemDto;
import com.example.salesstock.dto.RecentSaleDto;
import com.example.salesstock.dto.TopProductDto;
import com.example.salesstock.entity.*;
import com.example.salesstock.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

        private static final int TOP_PRODUCTS_LIMIT = 5;
        private static final int LOW_STOCK_LIMIT = 5;
        private static final int RECENT_SALES_LIMIT = 5;
        private static final int DASHBOARD_TREND_DAYS = 14;
        private static final int FORECAST_DAYS = 7;
        // Gap-filling a date range walks it day by day; cap how far back we'll do that for
        // an arbitrarily wide Analytics date range so a typo'd "from" year can't hang the request.
        private static final int MAX_TREND_FILL_DAYS = 366;

        private final InvoiceRepository invoiceRepository;
        private final InvoiceItemRepository invoiceItemRepository;
        private final ExpenseRepository expenseRepository;
        private final DebtRepository debtRepository;
        private final SupplierRepository supplierRepository;
        private final CustomerRepository customerRepository;
        private final ProductRepository productRepository;
        private final RefundRepository refundRepository;
        private final CashFlowRepository cashFlowRepository;


        public DashboardDto getDashboard() {
                LocalDate today = LocalDate.now();
                // Use CashFlow INVOICE-category credits for today — this covers BOTH Invoice
                // and quick-Sale entries (both go through InvoiceService), giving a unified
                // "Today's Sales" figure, without also counting same-day debt collections
                // on older invoices as if they were new sales (see sumSalesRevenue).
                BigDecimal todaySales = cashFlowRepository.sumCreditsByCategory(CashFlow.FlowCategory.INVOICE, today, today);
                if (todaySales == null)
                        todaySales = BigDecimal.ZERO;

                BigDecimal todayExpenses = expenseRepository.sumExpenses(today, today);
                BigDecimal totalReceivable = debtRepository.totalOutstandingDebt(Debt.DebtStatus.PAID);
                if (totalReceivable == null)
                        totalReceivable = BigDecimal.ZERO;

                // Sum total payable: supplier purchases unpaid (approximated)
                BigDecimal totalPayable = supplierRepository.findAll().stream()
                                .map(s -> s.getTotalPayable() != null ? s.getTotalPayable() : BigDecimal.ZERO)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                long lowStock = productRepository.findAll().stream()
                                .filter(p -> p.getMinAmount() != null && p.getAmountInStock() != null
                                                && p.getAmountInStock() <= p.getMinAmount())
                                .count();

                LocalDate trendFrom = today.minusDays(DASHBOARD_TREND_DAYS - 1);
                List<DailyPointDto> salesTrend = fillDateRange(
                                cashFlowRepository.dailyCreditsByCategory(CashFlow.FlowCategory.INVOICE, trendFrom, today),
                                trendFrom, today);

                LocalDate topProductsFrom = today.minusDays(29);
                List<TopProductDto> topProducts = invoiceItemRepository.findTopProducts(
                                topProductsFrom, today, PageRequest.of(0, TOP_PRODUCTS_LIMIT));

                List<LowStockItemDto> lowStockItems = productRepository.findLowStockItems(
                                PageRequest.of(0, LOW_STOCK_LIMIT));

                List<RecentSaleDto> recentSales = invoiceRepository.findRecentSales(
                                PageRequest.of(0, RECENT_SALES_LIMIT));

                return DashboardDto.builder()
                                .todaySales(todaySales)
                                .todayExpenses(todayExpenses)
                                .totalReceivable(totalReceivable)
                                .totalPayable(totalPayable)
                                .totalCustomers(customerRepository.count())
                                .totalSuppliers(supplierRepository.count())
                                .totalProducts(productRepository.count())
                                .lowStockCount(lowStock)
                                .pendingInvoices(invoiceRepository.pendingInvoiceCount(
                                                List.of(Invoice.InvoiceStatus.UNPAID, Invoice.InvoiceStatus.PARTIAL)))
                                .salesTrend(salesTrend)
                                .topProducts(topProducts)
                                .lowStockItems(lowStockItems)
                                .recentSales(recentSales)
                                .build();
        }

        public AnalyticsDto getAnalytics(String from, String to) {
                LocalDate fromDate = from != null && !from.isEmpty() ? LocalDate.parse(from)
                                : LocalDate.now().withDayOfMonth(1);
                LocalDate toDate = to != null && !to.isEmpty() ? LocalDate.parse(to) : LocalDate.now();

                BigDecimal totalCredits = cashFlowRepository.sumCreditsByCategory(CashFlow.FlowCategory.INVOICE, fromDate, toDate);
                BigDecimal totalRefunds = refundRepository.sumRefunds(fromDate, toDate);
                BigDecimal totalExpenses = expenseRepository.sumExpenses(fromDate, toDate);
                BigDecimal totalCost = invoiceRepository.sumProductCost(fromDate, toDate);
                if (totalCost == null)
                        totalCost = BigDecimal.ZERO;

                // Net revenue = cash-flow credits for the period minus refunds
                BigDecimal netRevenue = totalCredits.subtract(totalRefunds);
                // Gross profit = net revenue - cost of goods sold (uses current product.cost
                // as an approximation of COGS; a historical per-sale cost snapshot is a
                // planned follow-up for more accurate margins as costs change over time).
                BigDecimal grossProfit = netRevenue.subtract(totalCost);
                BigDecimal netProfit = grossProfit.subtract(totalExpenses);

                long invoiceCount = invoiceRepository.filter(null, null, null, fromDate, toDate,
                                org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements();
                long refundCount = refundRepository.filter(fromDate, toDate,
                                org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements();

                List<DailyPointDto> dailyTrend = fillDateRange(
                                cashFlowRepository.dailyCreditsByCategory(CashFlow.FlowCategory.INVOICE, fromDate, toDate),
                                fromDate, toDate);

                List<TopProductDto> topProducts = invoiceItemRepository.findTopProducts(
                                fromDate, toDate, PageRequest.of(0, TOP_PRODUCTS_LIMIT));

                return AnalyticsDto.builder()
                                .salesRevenue(totalCredits)
                                .totalRefunds(totalRefunds)
                                .totalCost(totalCost)
                                .grossProfit(grossProfit)
                                .totalExpenses(totalExpenses)
                                .netProfit(netProfit)
                                .invoiceCount(invoiceCount)
                                .refundCount(refundCount)
                                .dailyTrend(dailyTrend)
                                .topProducts(topProducts)
                                .forecast(computeForecast(dailyTrend))
                                .build();
        }

        // Fills gaps in a sparse day->amount series (days with no CashFlow rows are simply
        // absent from the query result) with zero, so trend charts don't draw misleading
        // straight lines across days that had no sales at all.
        private List<DailyPointDto> fillDateRange(List<DailyPointDto> sparse, LocalDate from, LocalDate to) {
                if (ChronoUnit.DAYS.between(from, to) > MAX_TREND_FILL_DAYS) {
                        from = to.minusDays(MAX_TREND_FILL_DAYS - 1);
                }
                Map<LocalDate, BigDecimal> byDate = sparse.stream()
                                .collect(Collectors.toMap(DailyPointDto::getDate, DailyPointDto::getValue));
                List<DailyPointDto> dense = new ArrayList<>();
                for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
                        dense.add(new DailyPointDto(d, byDate.getOrDefault(d, BigDecimal.ZERO)));
                }
                return dense;
        }

        // Least-squares linear regression over the daily trend, extrapolated 7 days past the
        // end of the series. Deliberately simple (no seasonality/ML) — this is a "keep going
        // in the direction things are going" estimate, not a real forecast model.
        private ForecastDto computeForecast(List<DailyPointDto> trend) {
                int n = trend.size();
                if (n == 0) {
                        return ForecastDto.builder()
                                        .projectedNext7Days(BigDecimal.ZERO)
                                        .changePercent(BigDecimal.ZERO)
                                        .trend("flat")
                                        .build();
                }

                double sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
                for (int i = 0; i < n; i++) {
                        double y = trend.get(i).getValue().doubleValue();
                        sumX += i;
                        sumY += y;
                        sumXY += (double) i * y;
                        sumXX += (double) i * i;
                }
                double avg = sumY / n;

                double denom = n * sumXX - sumX * sumX;
                double slope = denom == 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
                double intercept = (sumY - slope * sumX) / n;

                double projectedTotal = 0;
                for (int i = 0; i < FORECAST_DAYS; i++) {
                        double x = n + i;
                        projectedTotal += Math.max(intercept + slope * x, 0);
                }

                double changePercent = 0;
                String trendLabel = "flat";
                if (avg > 0) {
                        double projectedDailyAvg = projectedTotal / FORECAST_DAYS;
                        changePercent = ((projectedDailyAvg - avg) / avg) * 100;
                        if (changePercent > 5) trendLabel = "up";
                        else if (changePercent < -5) trendLabel = "down";
                }

                return ForecastDto.builder()
                                .projectedNext7Days(BigDecimal.valueOf(projectedTotal).setScale(2, RoundingMode.HALF_UP))
                                .changePercent(BigDecimal.valueOf(changePercent).setScale(1, RoundingMode.HALF_UP))
                                .trend(trendLabel)
                                .build();
        }
}
