package com.example.salesstock.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class StartShiftRequest {
    @NotNull(message = "Opening amount is required")
    @DecimalMin(value = "0", message = "Opening amount cannot be negative")
    private BigDecimal openingAmount;
}
