package com.example.salesstock.dto;

import com.example.salesstock.entity.Invoice;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class InvoiceDto {
    private Long id;
    private String invoiceNumber;

    @NotNull(message = "Customer is required")
    private Long customerId;
    private String customerName;

    @NotNull(message = "Invoice date is required")
    private LocalDate invoiceDate;
    private LocalDate dueDate;

    @Valid
    @NotNull
    private List<InvoiceItemDto> items;

    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal grandTotal;
    private BigDecimal paidAmount;
    private BigDecimal balance;

    private Invoice.InvoiceStatus status;
    private Invoice.PaymentType paymentType;
    private String notes;
}
