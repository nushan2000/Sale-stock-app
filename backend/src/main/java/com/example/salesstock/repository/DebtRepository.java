package com.example.salesstock.repository;

import com.example.salesstock.entity.Debt;
import com.example.salesstock.entity.Debt.DebtStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;

public interface DebtRepository extends JpaRepository<Debt, Long> {

        @Query("""
           SELECT d
           FROM Debt d
           WHERE (:customerId IS NULL OR d.customer.id = :customerId)
           AND (:status IS NULL OR d.status = :status)
           """)
        Page<Debt> filter(
                @Param("customerId") Long customerId,
                @Param("status") DebtStatus status,
                Pageable pageable
        );

        @Query("""
           SELECT COALESCE(SUM(d.remainingAmount), 0)
           FROM Debt d
           WHERE d.status <> :paidStatus
           """)
        BigDecimal totalOutstandingDebt(@Param("paidStatus") DebtStatus paidStatus);
}