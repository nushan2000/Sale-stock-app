package com.example.salesstock.dto;

import com.example.salesstock.entity.Purchase;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class PurchaseDto {
    private Long id;
    private String grnNumber;

    private Long supplierId;
    private String supplierName;

    @NotNull
    private LocalDate purchaseDate;

    @Valid
    @NotNull
    private List<PurchaseItemDto> items;

    private BigDecimal totalAmount;
    private Purchase.PaymentStatus paymentStatus;
    private Purchase.PaymentMethod paymentMethod;
    private String notes;
}
