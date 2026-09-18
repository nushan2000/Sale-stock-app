package com.example.salesstock.dto;

import com.example.salesstock.entity.Invoice;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RecentSaleDto {
    private String invoiceNumber;
    private String customerName;
    private BigDecimal grandTotal;
    private Invoice.InvoiceStatus status;
    private LocalDate invoiceDate;
}
