package com.example.salesstock.dto;

import com.example.salesstock.entity.Debt;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class DebtDto {
    private Long id;
    private Long customerId;
    private String customerName;
    private Long invoiceId;
    private String invoiceNumber;
    private BigDecimal totalDebt;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private LocalDate lastPaymentDate;
    private Debt.DebtStatus status;
}
