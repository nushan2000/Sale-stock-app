package com.example.salesstock.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class CloseShiftRequest {
    @NotNull(message = "Counted cash amount is required")
    @DecimalMin(value = "0", message = "Counted cash cannot be negative")
    private BigDecimal closingAmountCounted;

    private String notes;
}
