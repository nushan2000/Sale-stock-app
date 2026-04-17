package com.example.salesstock.service;

import com.example.salesstock.dto.PagedResponse;
import com.example.salesstock.dto.PurchaseDto;
import com.example.salesstock.dto.PurchaseItemDto;
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
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Transactional
public class PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final CashFlowRepository cashFlowRepository;
    private final StockMovementRepository stockMovementRepository;

    public PagedResponse<Purchase> getAll(String search, String from, String to, int page, int size) {
        LocalDate fromDate = from != null && !from.isEmpty() ? LocalDate.parse(from) : null;
        LocalDate toDate = to != null && !to.isEmpty() ? LocalDate.parse(to) : null;
        Page<Purchase> result = purchaseRepository.filter(search, fromDate, toDate,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "purchaseDate")));
        return new PagedResponse<>(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages(), result.isLast());
    }

    public Purchase getById(Long id) {
        return purchaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase not found: " + id));
    }

    public Purchase create(PurchaseDto dto) {
        Purchase purchase = new Purchase();
        purchase.setGrnNumber(generateGrn());
        purchase.setPurchaseDate(dto.getPurchaseDate());
        purchase.setPaymentStatus(
                dto.getPaymentStatus() != null ? dto.getPaymentStatus() : Purchase.PaymentStatus.UNPAID);
        purchase.setPaymentMethod(
                dto.getPaymentMethod() != null ? dto.getPaymentMethod() : Purchase.PaymentMethod.CASH);
        purchase.setNotes(dto.getNotes());

        if (dto.getSupplierId() != null) {
            Supplier supplier = supplierRepository.findById(dto.getSupplierId())
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + dto.getSupplierId()));
            purchase.setSupplier(supplier);
        }

        BigDecimal total = BigDecimal.ZERO;
        for (PurchaseItemDto itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemDto.getProductId()));

            PurchaseItem pi = new PurchaseItem();
            pi.setPurchase(purchase);
            pi.setProduct(product);
            pi.setQuantity(itemDto.getQuantity());
            pi.setUnitCost(itemDto.getUnitCost());
            BigDecimal lineTotal = itemDto.getUnitCost().multiply(BigDecimal.valueOf(itemDto.getQuantity())).setScale(2,
                    RoundingMode.HALF_UP);
            pi.setTotal(lineTotal);
            total = total.add(lineTotal);
            purchase.getItems().add(pi);

            // Business rule: increase stock
            int stockBefore = product.getAmountInStock();
            product.setAmountInStock(stockBefore + itemDto.getQuantity());
            // update product cost price
            product.setCost(itemDto.getUnitCost());
            productRepository.save(product);

            StockMovement sm = new StockMovement();
            sm.setProduct(product);
            sm.setType(StockMovement.MovementType.IN);
            sm.setQuantity(itemDto.getQuantity());
            sm.setStockBefore(stockBefore);
            sm.setStockAfter(product.getAmountInStock());
            sm.setReason("PURCHASE");
            stockMovementRepository.save(sm);
        }
        purchase.setTotalAmount(total);
        Purchase saved = purchaseRepository.save(purchase);

        // Cash flow DEBIT for supplier payment
        if (saved.getPaymentStatus() == Purchase.PaymentStatus.PAID) {
            CashFlow cf = new CashFlow();
            cf.setType(CashFlow.FlowType.DEBIT);
            cf.setCategory(CashFlow.FlowCategory.PURCHASE);
            cf.setReferenceId(saved.getId());
            cf.setReferenceType("PURCHASE");
            cf.setAmount(total);
            cf.setTransactionDate(dto.getPurchaseDate());
            cf.setNote("GRN " + saved.getGrnNumber());
            cashFlowRepository.save(cf);
        }
        return saved;
    }

    public void delete(Long id) {
        Purchase purchase = getById(id);
        // Reverse stock
        for (PurchaseItem item : purchase.getItems()) {
            Product product = item.getProduct();
            product.setAmountInStock(Math.max(0, product.getAmountInStock() - item.getQuantity()));
            productRepository.save(product);
        }
        purchaseRepository.delete(purchase);
    }

    private String generateGrn() {
        String prefix = "GRN-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-";
        String max = purchaseRepository.findMaxGrn(prefix);
        int seq = 1;
        if (max != null) {
            try {
                seq = Integer.parseInt(max.substring(prefix.length())) + 1;
            } catch (Exception ignored) {
            }
        }
        return prefix + String.format("%04d", seq);
    }
}
