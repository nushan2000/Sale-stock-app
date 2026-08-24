package com.example.salesstock.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final TokenAuthFilter tokenAuthFilter;

    @Value("${FRONTEND_CORS_URL:http://localhost:3000}")
    private String frontendCorsUrl;

    @Bean
    public BCryptPasswordEncoder bCryptPasswordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public auth endpoints
                .requestMatchers("/api/auth/login", "/api/auth/forgot-password", "/api/auth/reset-password").permitAll()
                // User administration and sensitive deletions are ADMIN-only. These
                // matchers must come before the general "/api/**".authenticated() rule
                // below since Spring Security uses first-match-wins.
                .requestMatchers("/api/users/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE,
                        "/api/customers/**", "/api/suppliers/**", "/api/invoices/**",
                        "/api/purchases/**", "/api/expenses/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/products/import/csv").hasRole("ADMIN")
                // Inventory & Sales (the public POS screen) and the Dashboard summary work
                // without logging in. This must come after the CSV-import rule above so that
                // admin-only endpoint still wins on its more specific match. Note /api/reports/
                // analytics is intentionally NOT included here — the Analytics page still
                // requires auth, unlike the plain dashboard summary.
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/sales").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/reports/dashboard").permitAll()
                // All other API endpoints just require authentication
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )
            .addFilterBefore(tokenAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        // FRONTEND_CORS_URL may hold one origin or a comma-separated list (e.g. local dev
        // + the deployed frontend). Previously this bean ignored the property entirely and
        // hardcoded "*" (allow any origin), which is what actually governed CORS for the
        // whole app since Spring Security's CORS bean takes precedence over the per-controller
        // @CrossOrigin annotations that referenced this same property.
        List<String> origins = Arrays.stream(frontendCorsUrl.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(false);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
