package com.example.salesstock.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class SupplierDto {
    private Long id;
    @NotBlank(message = "Name is required")
    private String name;
    private String phone;
    private String email;
    private String address;
    private BigDecimal totalPayable;
    private String notes;
}
