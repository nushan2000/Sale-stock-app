package com.example.salesstock.dto;

public record ResetPasswordRequest(String email, String otp, String newPassword) {}
