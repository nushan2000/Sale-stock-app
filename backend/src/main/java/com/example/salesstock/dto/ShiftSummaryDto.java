package com.example.salesstock.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.Map;

/** Live running totals for an open (or just-closed) shift. */
@Data
@Builder
public class ShiftSummaryDto {
    private Long shiftId;
    private BigDecimal openingAmount;
    private BigDecimal totalSales;
    private Map<String, BigDecimal> salesByPaymentType; // CASH/CARD/CREDIT/CHEQUE/SPLIT -> total
    private BigDecimal tillCashIn;
    private BigDecimal tillCashOut;
    private BigDecimal tillNet;
    // Cash expected in the drawer right now: opening + cash-only sales + till net movements.
    private BigDecimal expectedCash;
}
