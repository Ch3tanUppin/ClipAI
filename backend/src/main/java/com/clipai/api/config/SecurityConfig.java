package com.clipai.api.config;

import com.clipai.api.auth.JwtService;
import com.clipai.api.user.UserRepository;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthFilter jwtAuthFilter, AppProperties properties) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource(properties)))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**", "/webhooks/**", "/local-uploads/**", "/local-assets/**", "/actuator/health").permitAll()
                        .requestMatchers("/videos/share/**").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(AppProperties properties) {
        CorsConfiguration config = new CorsConfiguration();
        // Use allowed origin patterns and permissive headers in development to ensure
        // preflight responses include the expected CORS headers.
        config.setAllowedOriginPatterns(List.of(properties.frontendOrigin()));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setExposedHeaders(List.of("Authorization", "Content-Type"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    JwtAuthFilter jwtAuthFilter(JwtService jwtService, UserRepository users) {
        return new JwtAuthFilter(jwtService, users);
    }

    static class JwtAuthFilter extends OncePerRequestFilter {
        private final JwtService jwtService;
        private final UserRepository users;

        JwtAuthFilter(JwtService jwtService, UserRepository users) {
            this.jwtService = jwtService;
            this.users = users;
        }

        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
                throws ServletException, IOException {
            String header = request.getHeader(HttpHeaders.AUTHORIZATION);
            if (header != null && header.startsWith("Bearer ")) {
                try {
                    var claims = jwtService.parse(header.substring(7));
                    UUID userId = UUID.fromString(claims.getSubject());
                    users.findById(userId).ifPresent(user -> {
                        var auth = new UsernamePasswordAuthenticationToken(
                                user,
                                null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    });
                } catch (RuntimeException ignored) {
                    SecurityContextHolder.clearContext();
                }
            }
            chain.doFilter(request, response);
        }
    }
}
