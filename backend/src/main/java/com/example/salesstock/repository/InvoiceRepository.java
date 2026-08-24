package com.example.salesstock.repository;

import com.example.salesstock.entity.Invoice;
import com.example.salesstock.entity.Invoice.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

        @Query(value = "SELECT COUNT(*) FROM invoice WHERE invoice_number LIKE CONCAT(:prefix, '%')", nativeQuery = true)
        int countByPrefix(@Param("prefix") String prefix);

        @Query("""
           SELECT i
           FROM Invoice i
           LEFT JOIN i.customer c
           WHERE (:search IS NULL OR
                 LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR
                 LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')))
           AND (:status IS NULL OR i.status = :status)
           AND (:paymentType IS NULL OR i.paymentType = :paymentType)
           AND (:from IS NULL OR i.invoiceDate >= :from)
           AND (:to IS NULL OR i.invoiceDate <= :to)
           """)
        Page<Invoice> filter(@Param("search") String search,
                             @Param("status") InvoiceStatus status,
                             @Param("paymentType") Invoice.PaymentType paymentType,
                             @Param("from") LocalDate from,
                             @Param("to") LocalDate to,
                             Pageable pageable);

        @Query("""
           SELECT COALESCE(SUM(i.grandTotal), 0)
           FROM Invoice i
           WHERE i.invoiceDate = :date
           """)
        BigDecimal sumTodaySales(@Param("date") LocalDate date);

        @Query("""
           SELECT COALESCE(SUM(i.balance), 0)
           FROM Invoice i
           WHERE i.status <> :paidStatus
           """)
        BigDecimal totalReceivable(@Param("paidStatus") InvoiceStatus paidStatus);

        @Query("""
           SELECT COUNT(i)
           FROM Invoice i
           WHERE i.status IN :statuses
           """)
        long pendingInvoiceCount(@Param("statuses") java.util.List<InvoiceStatus> statuses);

        @Query("SELECT COALESCE(SUM(i.grandTotal), 0) FROM Invoice i WHERE i.shift.id = :shiftId")
        BigDecimal sumGrandTotalByShift(@Param("shiftId") Long shiftId);

        @Query("SELECT COALESCE(SUM(i.grandTotal), 0) FROM Invoice i " +
                "WHERE i.shift.id = :shiftId AND i.paymentType = :paymentType")
        BigDecimal sumGrandTotalByShiftAndPaymentType(@Param("shiftId") Long shiftId,
                                                       @Param("paymentType") Invoice.PaymentType paymentType);

        @Query(value = """
    SELECT COALESCE(SUM(ii.quantity * p.cost), 0) AS total_product_cost
    FROM invoice_item ii
    JOIN invoice i ON ii.invoice_id = i.id
    JOIN product p ON ii.product_id = p.id
    WHERE i.invoice_date >= :from
      AND i.invoice_date <= :to
""", nativeQuery = true)
        BigDecimal sumProductCost(@Param("from") LocalDate from,
                                  @Param("to") LocalDate to);
}