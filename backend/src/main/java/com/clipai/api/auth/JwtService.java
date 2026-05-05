package com.clipai.api.auth;

import com.clipai.api.config.AppProperties;
import com.clipai.api.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final AppProperties properties;
    private final SecretKey key;

    public JwtService(AppProperties properties) {
        this.properties = properties;
        this.key = Keys.hmacShaKeyFor(properties.jwt().secret().getBytes(StandardCharsets.UTF_8));
    }

    public String create(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .issuer(properties.jwt().issuer())
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(properties.jwt().ttlMinutes() * 60)))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .requireIssuer(properties.jwt().issuer())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}

