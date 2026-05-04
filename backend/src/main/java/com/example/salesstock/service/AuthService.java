package com.example.salesstock.service;

import com.example.salesstock.entity.AppUser;
import com.example.salesstock.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AppUserRepository userRepo;
    private final JavaMailSender mailSender;

    private final BCryptPasswordEncoder bCrypt = new BCryptPasswordEncoder();
    private final SecureRandom random = new SecureRandom();

    @Value("${app.admin.username:admin}")
    private String defaultAdminUsername;

    @Value("${app.admin.password:admin123}")
    private String defaultAdminPassword;

    @Value("${app.admin.email:admin@example.com}")
    private String defaultAdminEmail;

    // Called at startup to ensure at least one user exists
    public void ensureDefaultUser() {
        if (userRepo.count() == 0) {
            AppUser user = new AppUser();
            user.setUsername(defaultAdminUsername);
            user.setPassword(bCrypt.encode(defaultAdminPassword));
            user.setEmail(defaultAdminEmail);
            userRepo.save(user);
            System.out.println("✅ Default admin user created: " + defaultAdminUsername);
        }
    }

    /** Login — returns session token on success, null on failure */
    public String login(String username, String password) {
        AppUser user = userRepo.findByUsername(username).orElse(null);
        if (user == null || !bCrypt.matches(password, user.getPassword())) {
            return null;
        }
        String token = UUID.randomUUID().toString().replace("-", "");
        user.setSessionToken(token);
        user.setSessionExpiry(LocalDateTime.now().plusHours(24));
        userRepo.save(user);
        return token;
    }

    /** Validate a session token — returns user or null */
    public AppUser validate(String token) {
        if (token == null || token.isBlank()) return null;
        AppUser user = userRepo.findBySessionToken(token).orElse(null);
        if (user == null) return null;
        if (user.getSessionExpiry() == null || LocalDateTime.now().isAfter(user.getSessionExpiry())) {
            user.setSessionToken(null);
            userRepo.save(user);
            return null;
        }
        return user;
    }

    /** Logout */
    public void logout(String token) {
        userRepo.findBySessionToken(token).ifPresent(u -> {
            u.setSessionToken(null);
            u.setSessionExpiry(null);
            userRepo.save(u);
        });
    }

    /** Change password (requires old password) */
    public boolean changePassword(String token, String oldPassword, String newPassword) {
        AppUser user = validate(token);
        if (user == null) return false;
        if (!bCrypt.matches(oldPassword, user.getPassword())) return false;
        user.setPassword(bCrypt.encode(newPassword));
        // Invalidate session so user must re-login
        user.setSessionToken(null);
        user.setSessionExpiry(null);
        userRepo.save(user);
        return true;
    }

    /** Send OTP to email for password reset */
    public boolean sendOtp(String email) {
        AppUser user = userRepo.findByEmail(email).orElse(null);
        if (user == null) return false;
        String otp = String.format("%06d", random.nextInt(1_000_000));
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepo.save(user);

        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(email);
            msg.setSubject("ShopPro – Password Reset OTP");
            msg.setText(
                "Hello " + user.getUsername() + ",\n\n" +
                "Your OTP for password reset is: " + otp + "\n\n" +
                "This code expires in 10 minutes.\n\n" +
                "If you did not request this, ignore this email.\n\n" +
                "– ShopPro Team"
            );
            mailSender.send(msg);
            return true;
        } catch (Exception e) {
            System.err.println("Failed to send OTP email: " + e.getMessage());
            return false;
        }
    }

    /** Reset password using OTP */
    public boolean resetPassword(String email, String otp, String newPassword) {
        AppUser user = userRepo.findByEmail(email).orElse(null);
        if (user == null) return false;
        if (user.getOtpCode() == null || !user.getOtpCode().equals(otp)) return false;
        if (user.getOtpExpiry() == null || LocalDateTime.now().isAfter(user.getOtpExpiry())) return false;

        user.setPassword(bCrypt.encode(newPassword));
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        user.setSessionToken(null); // invalidate existing sessions
        user.setSessionExpiry(null);
        userRepo.save(user);
        return true;
    }
}
