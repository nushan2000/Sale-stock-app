package com.example.salesstock.dto;

import com.example.salesstock.entity.CashFlow;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CashFlowDto {
    private Long id;
    private CashFlow.FlowType type;
    private CashFlow.FlowCategory category;
    private Long referenceId;
    private String referenceType;
    private BigDecimal amount;
    private LocalDate transactionDate;
    private CashFlow.PaymentMethod paymentMethod;
    private String note;
}
