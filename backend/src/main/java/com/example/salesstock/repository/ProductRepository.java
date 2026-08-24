package com.example.salesstock.repository;

import com.example.salesstock.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("SELECT DISTINCT p.manufactur FROM Product p WHERE p.manufactur IS NOT NULL AND p.manufactur <> '' ORDER BY p.manufactur")
    List<String> findDistinctManufacturers();

    // Single query handling keyword + manufacturer together. Previously this was two
    // derived-query methods combined with Java if/else branching using a method name
    // like "...OrStockNoContainingIgnoreCaseAndManufactur" — Spring Data parses "And"
    // as binding tighter than "Or" (same as SQL), so that name actually meant
    // "description LIKE :kw OR (stockNo LIKE :kw AND manufactur = :m)": a keyword match
    // on description ignored the manufacturer filter entirely. Explicit parentheses here
    // fix that: (description LIKE OR stockNo LIKE) AND manufacturer.
    @Query("SELECT p FROM Product p WHERE " +
            "(:keyword IS NULL OR :keyword = '' OR " +
            "LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(p.stockNo) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:manufactur IS NULL OR :manufactur = '' OR p.manufactur = :manufactur)")
    Page<Product> search(@Param("keyword") String keyword,
                          @Param("manufactur") String manufactur,
                          Pageable pageable);

    List<Product> findByVendor(String vendor);
}
