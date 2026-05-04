package com.example.salesstock.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "app_user")
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password; // BCrypt hash

    @Column(nullable = false, unique = true)
    private String email;

    // OTP for password reset
    private String otpCode;
    private LocalDateTime otpExpiry;

    // Simple session token (random UUID stored server-side)
    @Column(length = 64)
    private String sessionToken;
    private LocalDateTime sessionExpiry;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
