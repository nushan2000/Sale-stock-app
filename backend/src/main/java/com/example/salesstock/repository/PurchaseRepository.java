package com.example.salesstock.repository;

import com.example.salesstock.entity.Purchase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    @Query("SELECT MAX(p.grnNumber) FROM Purchase p WHERE p.grnNumber LIKE :prefix%")
    String findMaxGrn(@Param("prefix") String prefix);

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
