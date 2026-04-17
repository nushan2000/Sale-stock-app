package com.example.salesstock.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class PurchaseItemDto {
    private Long id;

    @NotNull
    private Long productId;
    private String productName;

    @NotNull
    @Min(1)
    private Integer quantity;

    @NotNull
    private BigDecimal unitCost;

    private BigDecimal total;
}
