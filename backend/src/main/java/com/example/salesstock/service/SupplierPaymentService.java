package com.example.salesstock.service;

import com.example.salesstock.dto.SupplierPaymentDto;
import com.example.salesstock.entity.CashFlow;
import com.example.salesstock.entity.Supplier;
import com.example.salesstock.entity.SupplierPayment;
import com.example.salesstock.exception.BusinessException;
import com.example.salesstock.exception.ResourceNotFoundException;
import com.example.salesstock.repository.CashFlowRepository;
import com.example.salesstock.repository.SupplierPaymentRepository;
import com.example.salesstock.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SupplierPaymentService {

    private final SupplierPaymentRepository supplierPaymentRepository;
    private final SupplierRepository supplierRepository;
    private final CashFlowRepository cashFlowRepository;

    public List<SupplierPayment> getForSupplier(Long supplierId) {
        return supplierPaymentRepository.findBySupplierIdOrderByPaymentDateDesc(supplierId);
    }

    public SupplierPayment pay(Long supplierId, SupplierPaymentDto dto) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + supplierId));

        BigDecimal outstanding = supplier.getTotalPayable() != null ? supplier.getTotalPayable() : BigDecimal.ZERO;
        if (dto.getAmount().compareTo(outstanding) > 0) {
            throw new BusinessException("Amount (" + dto.getAmount()
                    + ") exceeds outstanding payable (" + outstanding + ")");
        }

        SupplierPayment payment = new SupplierPayment();
        payment.setSupplier(supplier);
        payment.setAmount(dto.getAmount());
        payment.setPaymentMethod(dto.getPaymentMethod());
        payment.setPaymentDate(dto.getPaymentDate());
        payment.setNote(dto.getNote());
        SupplierPayment saved = supplierPaymentRepository.save(payment);

        supplier.setTotalPayable(outstanding.subtract(dto.getAmount()));
        supplierRepository.save(supplier);

        CashFlow cf = new CashFlow();
        cf.setType(CashFlow.FlowType.DEBIT);
        cf.setCategory(CashFlow.FlowCategory.SUPPLIER);
        cf.setReferenceId(saved.getId());
        cf.setReferenceType("SUPPLIER_PAYMENT");
        cf.setAmount(dto.getAmount());
        cf.setTransactionDate(dto.getPaymentDate());
        cf.setNote("Payment to " + supplier.getName() + (dto.getNote() != null ? " — " + dto.getNote() : ""));
        cashFlowRepository.save(cf);

        return saved;
    }
}
