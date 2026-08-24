package com.example.salesstock.repository;

import com.example.salesstock.entity.Purchase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    @Query("SELECT MAX(p.grnNumber) FROM Purchase p WHERE p.grnNumber LIKE :prefix%")
    String findMaxGrn(@Param("prefix") String prefix);

    // paidStatus bound as a parameter rather than inlined as a fully-qualified enum
    // literal — Hibernate 6's HQL parser rejects that form (SemanticException) and
    // Spring Data validates every @Query method at startup, so this crashes the whole
    // app on boot rather than failing only when called. See CashFlowRepository for the
    // same fix.
    @Query("SELECT COALESCE(SUM(p.totalAmount), 0) FROM Purchase p " +
            "WHERE p.supplier.id = :supplierId AND p.paymentStatus <> :paidStatus")
    BigDecimal sumOutstandingBySupplier(@Param("supplierId") Long supplierId,
                                         @Param("paidStatus") Purchase.PaymentStatus paidStatus);

    @Query("SELECT p FROM Purchase p LEFT JOIN p.supplier s WHERE " +
            "(:search IS NULL OR LOWER(p.grnNumber) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:from IS NULL OR p.purchaseDate >= :from) " +
            "AND (:to IS NULL OR p.purchaseDate <= :to)")
    Page<Purchase> filter(@Param("search") String search,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            Pageable pageable);
}
