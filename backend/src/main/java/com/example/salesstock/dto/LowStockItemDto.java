package com.example.salesstock.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LowStockItemDto {
    private Long productId;
    private String description;
    private Integer amountInStock;
    private Integer minAmount;
}
