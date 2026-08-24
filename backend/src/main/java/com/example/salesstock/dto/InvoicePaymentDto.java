package com.example.salesstock.dto;

import com.example.salesstock.entity.InvoicePayment;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class InvoicePaymentDto {
    @NotNull(message = "Payment method is required")
    private InvoicePayment.Method method;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;
}
