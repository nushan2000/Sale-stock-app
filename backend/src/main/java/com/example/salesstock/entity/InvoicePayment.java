package com.example.salesstock.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

/** One payment-method row within a SPLIT-payment invoice. */
@Entity
@Data
@Table(name = "invoice_payment")
public class InvoicePayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    @JsonIgnore
    private Invoice invoice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Method method;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    public enum Method {
        CASH, CARD, BANK, CHEQUE
    }
}
