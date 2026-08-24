package com.example.salesstock.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "shift")
public class Shift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime = LocalDateTime.now();

    @Column(name = "opening_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal openingAmount = BigDecimal.ZERO;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "closing_amount_counted", precision = 15, scale = 2)
    private BigDecimal closingAmountCounted;

    @Column(name = "expected_cash", precision = 15, scale = 2)
    private BigDecimal expectedCash;

    @Column(name = "shortage_excess", precision = 15, scale = 2)
    private BigDecimal shortageExcess;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShiftStatus status = ShiftStatus.OPEN;

    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum ShiftStatus {
        OPEN, CLOSED
    }
}
