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

    // columnDefinition gives these DB-level defaults so Hibernate's ddl-auto=update
    // ALTER TABLE backfills existing rows to ADMIN/true instead of MySQL's implicit
    // '' / 0 for a bare NOT NULL column with no default — the same footgun already
    // guarded against on Product.version. Without this, an existing admin row gets
    // silently deactivated (active=0) and its role becomes an unparseable '' on the
    // very next backend restart after this column was introduced.
    // NOTE: do not put "NOT NULL" inside columnDefinition here — nullable=false already
    // makes Hibernate append its own "not null" after this string, so including it in
    // both places renders NOT NULL twice in the same column definition, which MySQL's
    // parser rejects as invalid syntax.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(20) DEFAULT 'ADMIN'")
    private Role role = Role.ADMIN;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT TRUE")
    private Boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Role {
        ADMIN, STAFF
    }
}
