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
import java.util.Optional;

public interface CashFlowRepository extends JpaRepository<CashFlow, Long> {

    Optional<CashFlow> findByReferenceTypeAndReferenceId(String referenceType, Long referenceId);

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

    // Sales-revenue-specific: only CREDIT entries in the INVOICE category. Debt payments
    // (category DEBT_PAYMENT) are also typed CREDIT — they're real cash inflow for the
    // Cash Flow ledger (sumCredits above, used by /cashflow/summary) but must NOT be
    // counted again as "Sales Revenue" here: the sale was already recognised in full at
    // invoice-creation time, so including the later debt payment too double-counts it.
    // The category is bound as a parameter rather than inlined as a fully-qualified enum
    // literal in the query string — Hibernate 6's HQL parser rejects that form outright
    // (SemanticException: "Could not interpret path expression") and fails at startup,
    // since Spring Data validates every @Query method eagerly when the app boots.
    @Query("SELECT COALESCE(SUM(cf.amount), 0) FROM CashFlow cf WHERE cf.type = 'CREDIT' " +
            "AND cf.category = :category " +
            "AND cf.transactionDate >= :from AND cf.transactionDate <= :to")
    BigDecimal sumCreditsByCategory(@Param("category") CashFlow.FlowCategory category,
                                     @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT COALESCE(SUM(cf.amount), 0) FROM CashFlow cf WHERE cf.type = 'DEBIT' AND cf.transactionDate >= :from AND cf.transactionDate <= :to")
    BigDecimal sumDebits(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT cf FROM CashFlow cf WHERE cf.transactionDate >= :from AND cf.transactionDate <= :to ORDER BY cf.transactionDate DESC")
    List<CashFlow> findAllForExport(@Param("from") LocalDate from, @Param("to") LocalDate to);


}
