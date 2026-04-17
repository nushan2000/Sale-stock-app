package com.example.salesstock.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class DebtPaymentDto {
    @NotNull
    private Long debtId;

    @NotNull
    @DecimalMin(value = "0.01", message = "Payment amount must be positive")
    private BigDecimal amount;

    private String paymentMethod;
    private String note;
}
