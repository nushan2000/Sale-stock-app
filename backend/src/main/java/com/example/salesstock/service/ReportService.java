package com.example.salesstock.service;

import com.example.salesstock.dto.AnalyticsDto;
import com.example.salesstock.dto.DashboardDto;
import com.example.salesstock.entity.*;
import com.example.salesstock.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

        private final InvoiceRepository invoiceRepository;
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

                return AnalyticsDto.builder()
                                .salesRevenue(totalCredits)
                                .totalRefunds(totalRefunds)
                                .totalCost(totalCost)
                                .grossProfit(grossProfit)
                                .totalExpenses(totalExpenses)
                                .netProfit(netProfit)
                                .invoiceCount(invoiceCount)
                                .refundCount(refundCount)
                                .build();
        }
}
