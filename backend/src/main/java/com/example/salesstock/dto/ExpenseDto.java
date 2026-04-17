package com.example.salesstock.dto;

import com.example.salesstock.entity.Expense;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ExpenseDto {
    private Long id;

    @NotBlank
    private String title;

    @NotNull
    private Expense.ExpenseCategory category;

    @NotNull
    private BigDecimal amount;

    @NotNull
    private LocalDate expenseDate;

    private Expense.PaymentMethod paymentMethod;
    private String notes;
}
