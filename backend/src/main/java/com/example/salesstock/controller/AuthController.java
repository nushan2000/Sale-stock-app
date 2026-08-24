package com.example.salesstock.controller;

import com.example.salesstock.dto.*;
import com.example.salesstock.entity.AppUser;
import com.example.salesstock.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        String token = authService.login(req.username(), req.password());
        if (token == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid username or password"));
        }
        return ResponseEntity.ok(Map.of("token", token));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("X-Auth-Token") String token) {
        authService.logout(token);
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader("X-Auth-Token") String token) {
        AppUser user = authService.validate(token);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        return ResponseEntity.ok(Map.of(
                "username", user.getUsername(),
                "email", user.getEmail(),
                "role", user.getRole().name()));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestHeader("X-Auth-Token") String token,
            @RequestBody ChangePasswordRequest req) {
        boolean ok = authService.changePassword(token, req.oldPassword(), req.newPassword());
        if (!ok) return ResponseEntity.status(400).body(Map.of("error", "Old password is incorrect or session invalid"));
        return ResponseEntity.ok(Map.of("message", "Password changed. Please log in again."));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest req) {
        boolean ok = authService.sendOtp(req.email());
        // Always return 200 to avoid email enumeration
        return ResponseEntity.ok(Map.of("message", ok
                ? "OTP sent to your email"
                : "If this email is registered, an OTP has been sent"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest req) {
        boolean ok = authService.resetPassword(req.email(), req.otp(), req.newPassword());
        if (!ok) return ResponseEntity.status(400).body(Map.of("error", "Invalid or expired OTP"));
        return ResponseEntity.ok(Map.of("message", "Password reset successfully. Please log in."));
    }
}
