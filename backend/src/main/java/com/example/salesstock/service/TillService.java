package com.example.salesstock.service;

import com.example.salesstock.dto.TillTransactionDto;
import com.example.salesstock.entity.Shift;
import com.example.salesstock.entity.TillTransaction;
import com.example.salesstock.exception.BusinessException;
import com.example.salesstock.repository.TillTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TillService {

    private final TillTransactionRepository tillTransactionRepository;
    private final ShiftService shiftService;

    public List<TillTransaction> getForShift(Long shiftId) {
        return tillTransactionRepository.findByShiftIdOrderByCreatedAtDesc(shiftId);
    }

    public TillTransaction add(Long shiftId, TillTransactionDto dto) {
        Shift shift = shiftService.getById(shiftId);
        if (shift.getStatus() != Shift.ShiftStatus.OPEN) {
            throw new BusinessException("Cannot record a till transaction on a closed shift");
        }
        TillTransaction t = new TillTransaction();
        t.setShift(shift);
        t.setType(dto.getType());
        t.setAmount(dto.getAmount());
        t.setNote(dto.getNote());
        return tillTransactionRepository.save(t);
    }
}
