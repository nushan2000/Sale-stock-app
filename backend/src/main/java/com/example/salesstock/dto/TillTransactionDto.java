package com.example.salesstock.dto;

import com.example.salesstock.entity.TillTransaction;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class TillTransactionDto {
    @NotNull(message = "Type is required")
    private TillTransaction.TillType type;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    private String note;
}
