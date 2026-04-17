package com.example.salesstock.repository;

import com.example.salesstock.entity.Refund;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface RefundRepository extends JpaRepository<Refund, Long> {
    @Query("SELECT r FROM Refund r WHERE " +
            "(:from IS NULL OR r.refundDate >= :from) AND (:to IS NULL OR r.refundDate <= :to)")
    Page<Refund> filter(@Param("from") LocalDate from, @Param("to") LocalDate to, Pageable pageable);

    @Query("SELECT COALESCE(SUM(r.refundAmount), 0) FROM Refund r WHERE r.refundDate >= :from AND r.refundDate <= :to")
    BigDecimal sumRefunds(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
