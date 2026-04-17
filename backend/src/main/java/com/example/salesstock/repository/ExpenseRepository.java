package com.example.salesstock.repository;

import com.example.salesstock.entity.Expense;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    @Query("SELECT e FROM Expense e WHERE " +
            "(:search IS NULL OR LOWER(e.title) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:category IS NULL OR e.category = :category) " +
            "AND (:from IS NULL OR e.expenseDate >= :from) " +
            "AND (:to IS NULL OR e.expenseDate <= :to)")
    Page<Expense> filter(@Param("search") String search,
            @Param("category") Expense.ExpenseCategory category,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            Pageable pageable);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.expenseDate >= :from AND e.expenseDate <= :to")
    BigDecimal sumExpenses(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
