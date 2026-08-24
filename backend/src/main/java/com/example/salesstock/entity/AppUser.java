package com.example.salesstock.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

    // Never serialize credentials/session material — UserController now returns
    // AppUser entities directly (list/create), same pattern as Customer/Supplier.
    @JsonIgnore
    @Column(nullable = false)
    private String password; // BCrypt hash

    @Column(nullable = false, unique = true)
    private String email;

    // OTP for password reset
    @JsonIgnore
    private String otpCode;
    @JsonIgnore
    private LocalDateTime otpExpiry;

    // Simple session token (random UUID stored server-side)
    @JsonIgnore
    @Column(length = 64)
    private String sessionToken;
    @JsonIgnore
    private LocalDateTime sessionExpiry;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.ADMIN;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Role {
        ADMIN, STAFF
    }
}
