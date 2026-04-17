package com.example.salesstock.service;

import com.example.salesstock.dto.DebtDto;
import com.example.salesstock.dto.DebtPaymentDto;
import com.example.salesstock.dto.PagedResponse;
import com.example.salesstock.entity.CashFlow;
import com.example.salesstock.entity.Debt;
import com.example.salesstock.entity.Customer;
import com.example.salesstock.exception.BusinessException;
import com.example.salesstock.exception.ResourceNotFoundException;
import com.example.salesstock.repository.CashFlowRepository;
import com.example.salesstock.repository.CustomerRepository;
import com.example.salesstock.repository.DebtRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional
public class DebtService {

    private final DebtRepository debtRepository;
    private final CustomerRepository customerRepository;
    private final CashFlowRepository cashFlowRepository;

    public PagedResponse<Debt> getAll(Long customerId, String status, int page, int size) {
        Debt.DebtStatus st = status != null && !status.isEmpty() ? Debt.DebtStatus.valueOf(status) : null;
        Page<Debt> result = debtRepository.filter(customerId, st,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return new PagedResponse<>(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages(), result.isLast());
    }

    public Debt getById(Long id) {
        return debtRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Debt not found: " + id));
    }

    public Debt payDebt(DebtPaymentDto dto) {
        Debt debt = getById(dto.getDebtId());
        if (debt.getStatus() == Debt.DebtStatus.PAID) {
            throw new BusinessException("Debt is already fully paid");
        }
        if (dto.getAmount().compareTo(debt.getRemainingAmount()) > 0) {
            throw new BusinessException("Payment amount exceeds remaining debt balance");
        }

        debt.setPaidAmount(debt.getPaidAmount().add(dto.getAmount()));
        debt.setRemainingAmount(debt.getRemainingAmount().subtract(dto.getAmount()));
        debt.setLastPaymentDate(LocalDate.now());

        if (debt.getRemainingAmount().compareTo(BigDecimal.ZERO) == 0) {
            debt.setStatus(Debt.DebtStatus.PAID);
        } else {
            debt.setStatus(Debt.DebtStatus.PARTIAL);
        }

        Debt saved = debtRepository.save(debt);

        // Update customer total debt
        Customer customer = debt.getCustomer();
        customer.setTotalDebt(customer.getTotalDebt().subtract(dto.getAmount()).max(BigDecimal.ZERO));
        customerRepository.save(customer);

        // Cash flow CREDIT entry for debt payment
        CashFlow cf = new CashFlow();
        cf.setType(CashFlow.FlowType.CREDIT);
        cf.setCategory(CashFlow.FlowCategory.DEBT_PAYMENT);
        cf.setReferenceId(debt.getId());
        cf.setReferenceType("DEBT");
        cf.setAmount(dto.getAmount());
        cf.setTransactionDate(LocalDate.now());
        cf.setNote("Debt payment from " + customer.getName());
        cashFlowRepository.save(cf);

        return saved;
    }

    public DebtDto toDto(Debt debt) {
        DebtDto dto = new DebtDto();
        dto.setId(debt.getId());
        dto.setCustomerId(debt.getCustomer().getId());
        dto.setCustomerName(debt.getCustomer().getName());
        if (debt.getInvoice() != null) {
            dto.setInvoiceId(debt.getInvoice().getId());
            dto.setInvoiceNumber(debt.getInvoice().getInvoiceNumber());
        }
        dto.setTotalDebt(debt.getTotalDebt());
        dto.setPaidAmount(debt.getPaidAmount());
        dto.setRemainingAmount(debt.getRemainingAmount());
        dto.setLastPaymentDate(debt.getLastPaymentDate());
        dto.setStatus(debt.getStatus());
        return dto;
    }
}
