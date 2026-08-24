package com.example.salesstock.controller;

import com.example.salesstock.dto.*;
import com.example.salesstock.entity.AppUser;
import com.example.salesstock.entity.Shift;
import com.example.salesstock.exception.BusinessException;
import com.example.salesstock.service.AuthService;
import com.example.salesstock.service.ShiftService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/shifts")
@RequiredArgsConstructor
public class ShiftController {

    private final ShiftService shiftService;
    private final AuthService authService;

    private AppUser currentUser() {
        AppUser user = authService.getCurrentUser();
        if (user == null) throw new BusinessException("Not authenticated");
        return user;
    }

    @GetMapping("/active")
    public ResponseEntity<Shift> getActive() {
        Shift shift = shiftService.getActiveShift(currentUser());
        return shift != null ? ResponseEntity.ok(shift) : ResponseEntity.noContent().build();
    }

    @PostMapping("/start")
    public ResponseEntity<Shift> start(@Valid @RequestBody StartShiftRequest req) {
        return ResponseEntity.ok(shiftService.start(currentUser(), req.getOpeningAmount()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Shift> getById(@PathVariable Long id) {
        return ResponseEntity.ok(shiftService.getById(id));
    }

    @GetMapping("/{id}/summary")
    public ResponseEntity<ShiftSummaryDto> getSummary(@PathVariable Long id) {
        return ResponseEntity.ok(shiftService.getSummary(id));
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<Shift> close(@PathVariable Long id, @Valid @RequestBody CloseShiftRequest req) {
        return ResponseEntity.ok(shiftService.close(id, req));
    }

    @GetMapping
    public ResponseEntity<PagedResponse<Shift>> getAll(
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "") String from,
            @RequestParam(defaultValue = "") String to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        // Non-admins only ever see their own shift history, regardless of userId passed.
        AppUser user = currentUser();
        Long effectiveUserId = user.getRole() == AppUser.Role.ADMIN ? userId : user.getId();
        return ResponseEntity.ok(shiftService.getAll(effectiveUserId, from, to, page, size));
    }
}
