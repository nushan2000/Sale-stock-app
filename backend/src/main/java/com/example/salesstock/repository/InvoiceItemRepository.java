package com.example.salesstock.repository;

import com.example.salesstock.entity.InvoiceItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, Long> {

    // Pageable here is used purely to LIMIT the result (top N by revenue) — no count
    // query runs since the method returns a List, not a Page.
    @Query("""
        SELECT new com.example.salesstock.dto.TopProductDto(p.id, p.description, SUM(ii.quantity), SUM(ii.total))
        FROM InvoiceItem ii
        JOIN ii.invoice i
        JOIN ii.product p
        WHERE i.invoiceDate >= :from AND i.invoiceDate <= :to
        GROUP BY p.id, p.description
        ORDER BY SUM(ii.total) DESC
        """)
    List<com.example.salesstock.dto.TopProductDto> findTopProducts(@Param("from") LocalDate from,
                                                                     @Param("to") LocalDate to,
                                                                     Pageable pageable);

    @Query(value = """
        SELECT new com.example.salesstock.dto.TopProductDto(p.id, p.description, SUM(ii.quantity), SUM(ii.total))
        FROM InvoiceItem ii
        JOIN ii.invoice i
        JOIN ii.product p
        WHERE i.invoiceDate >= :from AND i.invoiceDate <= :to
        GROUP BY p.id, p.description
        ORDER BY SUM(ii.total) DESC
        """,
        countQuery = """
        SELECT COUNT(DISTINCT p.id)
        FROM InvoiceItem ii
        JOIN ii.invoice i
        JOIN ii.product p
        WHERE i.invoiceDate >= :from AND i.invoiceDate <= :to
        """)
    org.springframework.data.domain.Page<com.example.salesstock.dto.TopProductDto> findTopProductsPaged(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            Pageable pageable);

    @Query(value = """
        SELECT new com.example.salesstock.dto.TopProductDto(p.id, p.description, SUM(ii.quantity), SUM(ii.total))
        FROM InvoiceItem ii
        JOIN ii.invoice i
        JOIN ii.product p
        WHERE i.invoiceDate >= :from AND i.invoiceDate <= :to
        GROUP BY p.id, p.description
        ORDER BY SUM(ii.quantity) DESC, SUM(ii.total) DESC
        """,
        countQuery = """
        SELECT COUNT(DISTINCT p.id)
        FROM InvoiceItem ii
        JOIN ii.invoice i
        JOIN ii.product p
        WHERE i.invoiceDate >= :from AND i.invoiceDate <= :to
        """)
    org.springframework.data.domain.Page<com.example.salesstock.dto.TopProductDto> findTopProductsByQuantityPaged(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            Pageable pageable);

    @Query("""
        SELECT MONTH(i.invoiceDate), SUM(ii.total), SUM(ii.quantity), COUNT(DISTINCT i.id)
        FROM InvoiceItem ii
        JOIN ii.invoice i
        WHERE i.invoiceDate >= :from AND i.invoiceDate <= :to
        GROUP BY MONTH(i.invoiceDate)
        ORDER BY MONTH(i.invoiceDate) ASC
        """)
    List<Object[]> getMonthlyTotals(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
