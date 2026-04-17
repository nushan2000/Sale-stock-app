package com.example.salesstock.service;

import com.example.salesstock.dto.ExpenseDto;
import com.example.salesstock.dto.PagedResponse;
import com.example.salesstock.entity.CashFlow;
import com.example.salesstock.entity.Expense;
import com.example.salesstock.exception.ResourceNotFoundException;
import com.example.salesstock.repository.CashFlowRepository;
import com.example.salesstock.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final CashFlowRepository cashFlowRepository;

    public PagedResponse<Expense> getAll(String search, String category, String from, String to, int page, int size) {
        Expense.ExpenseCategory cat = category != null && !category.isEmpty()
                ? Expense.ExpenseCategory.valueOf(category)
                : null;
        LocalDate fromDate = from != null && !from.isEmpty() ? LocalDate.parse(from) : null;
        LocalDate toDate = to != null && !to.isEmpty() ? LocalDate.parse(to) : null;
        Page<Expense> result = expenseRepository.filter(search, cat, fromDate, toDate,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "expenseDate")));
        return new PagedResponse<>(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages(), result.isLast());
    }

    public Expense getById(Long id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found: " + id));
    }

    public Expense create(ExpenseDto dto) {
        Expense expense = new Expense();
        mapDtoToEntity(dto, expense);
        Expense saved = expenseRepository.save(expense);

        // Cash flow DEBIT
        CashFlow cf = new CashFlow();
        cf.setType(CashFlow.FlowType.DEBIT);
        cf.setCategory(CashFlow.FlowCategory.EXPENSE);
        cf.setReferenceId(saved.getId());
        cf.setReferenceType("EXPENSE");
        cf.setAmount(dto.getAmount());
        cf.setTransactionDate(dto.getExpenseDate());
        cf.setNote(dto.getTitle());
        cashFlowRepository.save(cf);

        return saved;
    }

    public Expense update(Long id, ExpenseDto dto) {
        Expense expense = getById(id);
        mapDtoToEntity(dto, expense);
        return expenseRepository.save(expense);
    }

    public void delete(Long id) {
        expenseRepository.deleteById(id);
    }

    private void mapDtoToEntity(ExpenseDto dto, Expense e) {
        e.setTitle(dto.getTitle());
        e.setCategory(dto.getCategory());
        e.setAmount(dto.getAmount());
        e.setExpenseDate(dto.getExpenseDate());
        e.setPaymentMethod(dto.getPaymentMethod());
        e.setNotes(dto.getNotes());
    }
}
