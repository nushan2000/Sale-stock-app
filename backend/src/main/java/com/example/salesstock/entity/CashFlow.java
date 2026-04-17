package com.example.salesstock.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "cash_flow")
public class CashFlow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FlowType type; // CREDIT / DEBIT

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FlowCategory category; // INVOICE, BILL, EXPENSE, SUPPLIER, REFUND, DEBT_PAYMENT, PURCHASE

    @Column(name = "reference_id")
    private Long referenceId; // FK to invoice/refund/expense/purchase etc.

    @Column(name = "reference_type")
    private String referenceType; // "INVOICE", "REFUND", etc.

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method")
    private PaymentMethod paymentMethod = PaymentMethod.CASH;

    private String note;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum FlowType {
        CREDIT, DEBIT
    }

    public enum FlowCategory {
        INVOICE, EXPENSE, SUPPLIER, REFUND, DEBT_PAYMENT, PURCHASE, OTHER
    }

    public enum PaymentMethod {
        CASH, CARD, BANK, CREDIT
    }
}
