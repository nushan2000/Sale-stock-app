package com.example.salesstock.service;

import com.example.salesstock.dto.CloseShiftRequest;
import com.example.salesstock.dto.PagedResponse;
import com.example.salesstock.dto.ShiftSummaryDto;
import com.example.salesstock.entity.AppUser;
import com.example.salesstock.entity.Invoice;
import com.example.salesstock.entity.Shift;
import com.example.salesstock.entity.TillTransaction;
import com.example.salesstock.exception.BusinessException;
import com.example.salesstock.exception.ResourceNotFoundException;
import com.example.salesstock.repository.InvoiceRepository;
import com.example.salesstock.repository.ShiftRepository;
import com.example.salesstock.repository.TillTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class ShiftService {

    private final ShiftRepository shiftRepository;
    private final TillTransactionRepository tillTransactionRepository;
    private final InvoiceRepository invoiceRepository;

    public Shift getActiveShift(AppUser user) {
        return shiftRepository.findFirstByUserAndStatusOrderByStartTimeDesc(user, Shift.ShiftStatus.OPEN)
                .orElse(null);
    }

    public Shift start(AppUser user, BigDecimal openingAmount) {
        if (getActiveShift(user) != null) {
            throw new BusinessException("You already have an open shift");
        }
        Shift shift = new Shift();
        shift.setUser(user);
        shift.setOpeningAmount(openingAmount);
        return shiftRepository.save(shift);
    }

    public Shift getById(Long id) {
        return shiftRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shift not found: " + id));
    }

    public PagedResponse<Shift> getAll(Long userId, String from, String to, int page, int size) {
        LocalDate fromDate = from != null && !from.isEmpty() ? LocalDate.parse(from) : null;
        LocalDate toDate = to != null && !to.isEmpty() ? LocalDate.parse(to) : null;
        Page<Shift> result = shiftRepository.filter(userId, fromDate, toDate,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "startTime")));
        return new PagedResponse<>(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages(), result.isLast());
    }

    public ShiftSummaryDto getSummary(Long shiftId) {
        Shift shift = getById(shiftId);

        Map<String, BigDecimal> byType = new LinkedHashMap<>();
        BigDecimal totalSales = invoiceRepository.sumGrandTotalByShift(shiftId);
        BigDecimal cashSales = BigDecimal.ZERO;
        for (Invoice.PaymentType t : Invoice.PaymentType.values()) {
            BigDecimal sum = invoiceRepository.sumGrandTotalByShiftAndPaymentType(shiftId, t);
            byType.put(t.name(), sum);
            if (t == Invoice.PaymentType.CASH) cashSales = sum;
        }

        BigDecimal cashIn = tillTransactionRepository.sumByShiftAndType(shiftId, TillTransaction.TillType.CASH_IN);
        BigDecimal cashOut = tillTransactionRepository.sumByShiftAndType(shiftId, TillTransaction.TillType.CASH_OUT);
        BigDecimal tillNet = cashIn.subtract(cashOut);

        BigDecimal expectedCash = shift.getOpeningAmount().add(cashSales).add(tillNet);

        return ShiftSummaryDto.builder()
                .shiftId(shiftId)
                .openingAmount(shift.getOpeningAmount())
                .totalSales(totalSales)
                .salesByPaymentType(byType)
                .tillCashIn(cashIn)
                .tillCashOut(cashOut)
                .tillNet(tillNet)
                .expectedCash(expectedCash)
                .build();
    }

    public Shift close(Long shiftId, CloseShiftRequest req) {
        Shift shift = getById(shiftId);
        if (shift.getStatus() != Shift.ShiftStatus.OPEN) {
            throw new BusinessException("Shift is already closed");
        }
        ShiftSummaryDto summary = getSummary(shiftId);

        shift.setEndTime(LocalDateTime.now());
        shift.setClosingAmountCounted(req.getClosingAmountCounted());
        shift.setExpectedCash(summary.getExpectedCash());
        shift.setShortageExcess(req.getClosingAmountCounted().subtract(summary.getExpectedCash()));
        shift.setStatus(Shift.ShiftStatus.CLOSED);
        shift.setNotes(req.getNotes());
        return shiftRepository.save(shift);
    }
}
