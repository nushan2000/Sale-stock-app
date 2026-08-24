package com.example.salesstock.config;

import com.example.salesstock.entity.AppUser;
import com.example.salesstock.service.AuthService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class TokenAuthFilter extends OncePerRequestFilter {

    private final AuthService authService;

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {
        String token = req.getHeader("X-Auth-Token");
        if (token != null && !token.isBlank()) {
            AppUser user = authService.validate(token);
            if (user != null) {
                // Authority reflects the user's role (e.g. ROLE_ADMIN, ROLE_STAFF) so
                // SecurityConfig can gate admin-only routes with hasRole("ADMIN"), while
                // any authenticated user still satisfies plain authenticated() checks.
                var auth = new UsernamePasswordAuthenticationToken(
                        user.getUsername(), null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        chain.doFilter(req, res);
    }
}
