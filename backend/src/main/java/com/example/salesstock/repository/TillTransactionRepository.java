package com.example.salesstock.repository;

import com.example.salesstock.entity.TillTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface TillTransactionRepository extends JpaRepository<TillTransaction, Long> {

    List<TillTransaction> findByShiftIdOrderByCreatedAtDesc(Long shiftId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM TillTransaction t " +
            "WHERE t.shift.id = :shiftId AND t.type = :type")
    BigDecimal sumByShiftAndType(@Param("shiftId") Long shiftId, @Param("type") TillTransaction.TillType type);
}
