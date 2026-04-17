package com.example.salesstock.service;

import com.example.salesstock.dto.PagedResponse;
import com.example.salesstock.dto.RefundDto;
import com.example.salesstock.dto.RefundItemDto;
import com.example.salesstock.entity.*;
import com.example.salesstock.exception.ResourceNotFoundException;
import com.example.salesstock.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional
public class RefundService {

    private final RefundRepository refundRepository;
    private final InvoiceRepository invoiceRepository;
    private final ProductRepository productRepository;
    private final CashFlowRepository cashFlowRepository;
    private final StockMovementRepository stockMovementRepository;

    public PagedResponse<Refund> getAll(String from, String to, int page, int size) {
        LocalDate fromDate = from != null && !from.isEmpty() ? LocalDate.parse(from) : null;
        LocalDate toDate = to != null && !to.isEmpty() ? LocalDate.parse(to) : null;
        Page<Refund> result = refundRepository.filter(fromDate, toDate,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "refundDate")));
        return new PagedResponse<>(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages(), result.isLast());
    }

    public Refund getById(Long id) {
        return refundRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Refund not found: " + id));
    }

    public Refund create(RefundDto dto) {
        Invoice invoice = invoiceRepository.findById(dto.getInvoiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + dto.getInvoiceId()));

        Refund refund = new Refund();
        refund.setInvoice(invoice);
        refund.setRefundDate(dto.getRefundDate());
        refund.setReason(dto.getReason());
        refund.setRefundMethod(dto.getRefundMethod() != null ? dto.getRefundMethod() : Refund.RefundMethod.CASH);

        BigDecimal totalRefund = BigDecimal.ZERO;

        for (RefundItemDto itemDto : dto.getReturnedItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemDto.getProductId()));

            RefundItem ri = new RefundItem();
            ri.setRefund(refund);
            ri.setProduct(product);
            ri.setQuantity(itemDto.getQuantity());
            BigDecimal unitPrice = itemDto.getUnitPrice() != null ? itemDto.getUnitPrice() : product.getRetail();
            ri.setUnitPrice(unitPrice);
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(itemDto.getQuantity())).setScale(2,
                    RoundingMode.HALF_UP);
            ri.setTotal(lineTotal);
            totalRefund = totalRefund.add(lineTotal);
            refund.getReturnedItems().add(ri);

            // Business rule: restore stock
            int stockBefore = product.getAmountInStock();
            product.setAmountInStock(stockBefore + itemDto.getQuantity());
            productRepository.save(product);

            // Log stock movement
            StockMovement sm = new StockMovement();
            sm.setProduct(product);
            sm.setType(StockMovement.MovementType.IN);
            sm.setQuantity(itemDto.getQuantity());
            sm.setStockBefore(stockBefore);
            sm.setStockAfter(product.getAmountInStock());
            sm.setReason("REFUND");
            stockMovementRepository.save(sm);
        }

        refund.setRefundAmount(totalRefund);
        Refund saved = refundRepository.save(refund);

        // Business rule: update invoice balance (increase, as money going back)
        invoice.setPaidAmount(invoice.getPaidAmount().subtract(totalRefund).max(BigDecimal.ZERO));
        invoice.setBalance(invoice.getGrandTotal().subtract(invoice.getPaidAmount()));
        if (invoice.getPaidAmount().compareTo(BigDecimal.ZERO) == 0) {
            invoice.setStatus(Invoice.InvoiceStatus.UNPAID);
        } else if (invoice.getPaidAmount().compareTo(invoice.getGrandTotal()) < 0) {
            invoice.setStatus(Invoice.InvoiceStatus.PARTIAL);
        }
        invoiceRepository.save(invoice);

        // Business rule: cash flow DEBIT entry for refund
        CashFlow cf = new CashFlow();
        cf.setType(CashFlow.FlowType.DEBIT);
        cf.setCategory(CashFlow.FlowCategory.REFUND);
        cf.setReferenceId(saved.getId());
        cf.setReferenceType("REFUND");
        cf.setAmount(totalRefund);
        cf.setTransactionDate(dto.getRefundDate());
        cf.setNote("Refund for Invoice " + invoice.getInvoiceNumber());
        cashFlowRepository.save(cf);

        return saved;
    }
}
