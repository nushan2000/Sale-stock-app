package com.example.salesstock.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TopProductDto {
    private Long productId;
    private String description;
    private Long quantitySold;
    private BigDecimal revenue;
}
