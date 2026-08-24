package com.example.salesstock.repository;

import com.example.salesstock.entity.AppUser;
import com.example.salesstock.entity.Shift;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface ShiftRepository extends JpaRepository<Shift, Long> {

    Optional<Shift> findFirstByUserAndStatusOrderByStartTimeDesc(AppUser user, Shift.ShiftStatus status);

    @Query("SELECT s FROM Shift s LEFT JOIN s.user u WHERE " +
            "(:userId IS NULL OR u.id = :userId) " +
            "AND (:from IS NULL OR FUNCTION('DATE', s.startTime) >= :from) " +
            "AND (:to IS NULL OR FUNCTION('DATE', s.startTime) <= :to) " +
            "ORDER BY s.startTime DESC")
    Page<Shift> filter(@Param("userId") Long userId,
                        @Param("from") LocalDate from,
                        @Param("to") LocalDate to,
                        Pageable pageable);
}
