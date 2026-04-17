package com.example.salesstock.dto;

import com.example.salesstock.entity.Refund;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class RefundDto {
    private Long id;

    @NotNull(message = "Invoice is required")
    private Long invoiceId;
    private String invoiceNumber;

    @NotNull(message = "Refund date is required")
    private LocalDate refundDate;

    private BigDecimal refundAmount;
    private String reason;
    private Refund.RefundMethod refundMethod;

    @Valid
    private List<RefundItemDto> returnedItems;
}
