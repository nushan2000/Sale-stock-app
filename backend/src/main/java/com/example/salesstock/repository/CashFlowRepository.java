package com.example.salesstock.repository;

import com.example.salesstock.entity.CashFlow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface CashFlowRepository extends JpaRepository<CashFlow, Long> {

    @Query("SELECT cf FROM CashFlow cf WHERE " +
            "(:type IS NULL OR cf.type = :type) " +
            "AND (:category IS NULL OR cf.category = :category) " +
            "AND (:from IS NULL OR cf.transactionDate >= :from) " +
            "AND (:to IS NULL OR cf.transactionDate <= :to) " +
            "ORDER BY cf.transactionDate DESC")
    Page<CashFlow> filter(@Param("type") CashFlow.FlowType type,
            @Param("category") CashFlow.FlowCategory category,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            Pageable pageable);

    @Query("SELECT COALESCE(SUM(cf.amount), 0) FROM CashFlow cf WHERE cf.type = 'CREDIT' AND cf.transactionDate >= :from AND cf.transactionDate <= :to")
    BigDecimal sumCredits(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT COALESCE(SUM(cf.amount), 0) FROM CashFlow cf WHERE cf.type = 'DEBIT' AND cf.transactionDate >= :from AND cf.transactionDate <= :to")
    BigDecimal sumDebits(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT cf FROM CashFlow cf WHERE cf.transactionDate >= :from AND cf.transactionDate <= :to ORDER BY cf.transactionDate DESC")
    List<CashFlow> findAllForExport(@Param("from") LocalDate from, @Param("to") LocalDate to);


}
