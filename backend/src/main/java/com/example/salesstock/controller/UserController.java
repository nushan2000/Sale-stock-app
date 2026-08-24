package com.example.salesstock.controller;

import com.example.salesstock.dto.UserDto;
import com.example.salesstock.entity.AppUser;
import com.example.salesstock.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * User administration — restricted to ROLE_ADMIN via SecurityConfig
 * (requestMatchers("/api/users/**").hasRole("ADMIN")).
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<AppUser>> getAll() {
        return ResponseEntity.ok(userService.getAll());
    }

    @PostMapping
    public ResponseEntity<AppUser> create(@Valid @RequestBody UserDto dto) {
        return ResponseEntity.ok(userService.create(dto));
    }

    /** Updates role and/or active status only — not username/email/password. */
    @PatchMapping("/{id}")
    public ResponseEntity<AppUser> updateRoleAndStatus(@PathVariable Long id, @RequestBody UserDto dto) {
        return ResponseEntity.ok(userService.updateRoleAndStatus(id, dto));
    }
}
