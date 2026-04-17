package com.example.salesstock.service;

import com.example.salesstock.dto.InvoiceDto;
import com.example.salesstock.dto.InvoiceItemDto;
import com.example.salesstock.dto.PagedResponse;
import com.example.salesstock.entity.*;
import com.example.salesstock.exception.BusinessException;
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
import java.util.ArrayList;
import java.util.List;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Transactional
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final DebtRepository debtRepository;
    private final CashFlowRepository cashFlowRepository;
    private final StockMovementRepository stockMovementRepository;

    public PagedResponse<Invoice> getAll(String search, String status, String from, String to,
            int page, int size, String sort) {
        Invoice.InvoiceStatus st = status != null && !status.isEmpty() ? Invoice.InvoiceStatus.valueOf(status) : null;
        LocalDate fromDate = from != null && !from.isEmpty() ? LocalDate.parse(from) : null;
        LocalDate toDate = to != null && !to.isEmpty() ? LocalDate.parse(to) : null;
        Sort s = Sort.by(Sort.Direction.DESC, sort.isEmpty() ? "invoiceDate" : sort);
        Page<Invoice> result = invoiceRepository.filter(search, st, fromDate, toDate, PageRequest.of(page, size, s));
        return new PagedResponse<>(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages(), result.isLast());
    }

    public Invoice getById(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + id));
    }

    public Invoice create(InvoiceDto dto) {
        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(generateInvoiceNumber());
        List<StockMovementDto> pendingMovements = new ArrayList<>();
        populateInvoice(invoice, dto, pendingMovements);
        Invoice saved = invoiceRepository.save(invoice);

        // Write stock movements now that we have the invoice ID
        for (StockMovementDto m : pendingMovements) {
            logStockMovement(m.product, m.type, m.qty, m.before, m.after, m.reason, saved.getId());
        }

        // Business rule: auto-create debt for CREDIT invoices
        if (saved.getPaymentType() == Invoice.PaymentType.CREDIT && saved.getBalance().compareTo(BigDecimal.ZERO) > 0) {
            createDebt(saved);
        }

        // Business rule: add cash flow entry
        addCashFlowEntry(saved);

        return saved;
    }

    public Invoice update(Long id, InvoiceDto dto) {
        Invoice invoice = getById(id);
        // Restore stock before recalculating
        for (InvoiceItem item : invoice.getItems()) {
            Product product = item.getProduct();
            product.setAmountInStock(product.getAmountInStock() + item.getQuantity());
            productRepository.save(product);
        }
        invoice.getItems().clear();
        List<StockMovementDto> pendingMovements = new ArrayList<>();
        populateInvoice(invoice, dto, pendingMovements);
        Invoice saved = invoiceRepository.save(invoice);
        for (StockMovementDto m : pendingMovements) {
            logStockMovement(m.product, m.type, m.qty, m.before, m.after, m.reason, saved.getId());
        }
        return saved;
    }

    public void delete(Long id) {
        Invoice invoice = getById(id);
        // Restore stock
        for (InvoiceItem item : invoice.getItems()) {
            Product product = item.getProduct();
            int stockBefore = product.getAmountInStock();
            product.setAmountInStock(stockBefore + item.getQuantity());
            productRepository.save(product);
            logStockMovement(product, StockMovement.MovementType.IN, item.getQuantity(),
                    stockBefore, product.getAmountInStock(), "INVOICE_DELETED", id);
        }
        invoiceRepository.delete(invoice);
    }

    // ── Inner DTO for deferred stock movement logging ────────────────────────
    private record StockMovementDto(Product product, StockMovement.MovementType type, int qty, int before, int after,
            String reason) {
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private void populateInvoice(Invoice invoice, InvoiceDto dto, List<StockMovementDto> pendingMovements) {
        Customer customer = customerRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + dto.getCustomerId()));
        invoice.setCustomer(customer);
        invoice.setInvoiceDate(dto.getInvoiceDate());
        invoice.setDueDate(dto.getDueDate());
        invoice.setPaymentType(dto.getPaymentType() != null ? dto.getPaymentType() : Invoice.PaymentType.CASH);
        invoice.setNotes(dto.getNotes());

        BigDecimal subtotal = BigDecimal.ZERO;
        for (InvoiceItemDto itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemDto.getProductId()));
            if (product.getAmountInStock() < itemDto.getQuantity()) {
                throw new BusinessException("Insufficient stock for: " + product.getDescription()
                        + " (available: " + product.getAmountInStock() + ")");
            }

            InvoiceItem item = new InvoiceItem();
            item.setInvoice(invoice);
            item.setProduct(product);
            item.setQuantity(itemDto.getQuantity());
            item.setUnitPrice(itemDto.getUnitPrice());
            item.setDiscount(itemDto.getDiscount() != null ? itemDto.getDiscount() : BigDecimal.ZERO);
            item.setTax(itemDto.getTax() != null ? itemDto.getTax() : BigDecimal.ZERO);

            // total = qty * unitPrice * (1 - discount%) * (1 + tax%)
            BigDecimal lineTotal = itemDto.getUnitPrice()
                    .multiply(BigDecimal.valueOf(itemDto.getQuantity()))
                    .multiply(BigDecimal.ONE
                            .subtract(item.getDiscount().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)))
                    .multiply(
                            BigDecimal.ONE.add(item.getTax().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)))
                    .setScale(2, RoundingMode.HALF_UP);
            item.setTotal(lineTotal);
            subtotal = subtotal.add(lineTotal);
            invoice.getItems().add(item);

            // Reduce stock
            int stockBefore = product.getAmountInStock();
            product.setAmountInStock(stockBefore - itemDto.getQuantity());
            productRepository.save(product);
            // Defer stock movement log until invoice is saved (to get ID)
            pendingMovements.add(new StockMovementDto(product, StockMovement.MovementType.OUT,
                    itemDto.getQuantity(), stockBefore, product.getAmountInStock(), "INVOICE"));
        }

        invoice.setSubtotal(subtotal);
        invoice.setDiscountAmount(dto.getDiscountAmount() != null ? dto.getDiscountAmount() : BigDecimal.ZERO);
        invoice.setTaxAmount(dto.getTaxAmount() != null ? dto.getTaxAmount() : BigDecimal.ZERO);
        BigDecimal grand = subtotal.subtract(invoice.getDiscountAmount()).add(invoice.getTaxAmount()).setScale(2,
                RoundingMode.HALF_UP);
        invoice.setGrandTotal(grand);

        BigDecimal paid = dto.getPaidAmount() != null ? dto.getPaidAmount() : BigDecimal.ZERO;
        invoice.setPaidAmount(paid);
        invoice.setBalance(grand.subtract(paid).max(BigDecimal.ZERO));

        // Determine status
        if (paid.compareTo(BigDecimal.ZERO) == 0) {
            invoice.setStatus(Invoice.InvoiceStatus.UNPAID);
        } else if (paid.compareTo(grand) >= 0) {
            invoice.setStatus(Invoice.InvoiceStatus.PAID);
        } else {
            invoice.setStatus(Invoice.InvoiceStatus.PARTIAL);
        }
    }

    private String generateInvoiceNumber() {
        String prefix = "INV-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-";
        int seq = invoiceRepository.countByPrefix(prefix) + 1;
        return prefix + String.format("%04d", seq);
    }

    private void createDebt(Invoice invoice) {
        Debt debt = new Debt();
        debt.setCustomer(invoice.getCustomer());
        debt.setInvoice(invoice);
        debt.setTotalDebt(invoice.getBalance());
        debt.setPaidAmount(BigDecimal.ZERO);
        debt.setRemainingAmount(invoice.getBalance());
        debt.setStatus(Debt.DebtStatus.UNPAID);
        debtRepository.save(debt);

        // Update customer total debt
        Customer customer = invoice.getCustomer();
        customer.setTotalDebt(customer.getTotalDebt().add(invoice.getBalance()));
        customerRepository.save(customer);
    }

    private void addCashFlowEntry(Invoice invoice) {
        // Always write a CashFlow CREDIT entry using grandTotal so that ALL invoices
        // (including CREDIT / UNPAID) appear correctly in Analytics revenue figures.
        // Using grandTotal (the full sale value) rather than paidAmount ensures the
        // revenue is recognised at the point of sale, matching the Dashboard query.
        CashFlow cf = new CashFlow();
        cf.setType(CashFlow.FlowType.CREDIT);
        cf.setCategory(CashFlow.FlowCategory.INVOICE);
        cf.setReferenceId(invoice.getId());
        cf.setReferenceType("INVOICE");
        cf.setAmount(invoice.getGrandTotal()); // ← was paidAmount (bug)
        cf.setTransactionDate(invoice.getInvoiceDate());
        cf.setNote("Invoice " + invoice.getInvoiceNumber());
        cashFlowRepository.save(cf);
    }

    private void logStockMovement(Product product, StockMovement.MovementType type, int qty,
            int before, int after, String reason, Long refId) {
        StockMovement sm = new StockMovement();
        sm.setProduct(product);
        sm.setType(type);
        sm.setQuantity(qty);
        sm.setStockBefore(before);
        sm.setStockAfter(after);
        sm.setReason(reason);
        sm.setReferenceId(refId);
        stockMovementRepository.save(sm);
    }
}
