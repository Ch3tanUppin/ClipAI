package com.clipai.api.auth;

import com.clipai.api.common.ApiException;
import com.clipai.api.user.User;
import com.clipai.api.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwtService) {
        this.users = users;
        this.encoder = encoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthDtos.AuthResponse signup(AuthDtos.SignupRequest request) {
        String email = request.email().trim().toLowerCase();
        if (users.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already registered");
        }
        User user = new User();
        user.setEmail(email);
        user.setDisplayName(request.displayName().trim());
        user.setPasswordHash(encoder.encode(request.password()));
        users.save(user);
        return response(user);
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        User user = users.findByEmail(request.email().trim().toLowerCase())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!encoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        return response(user);
    }

    private AuthDtos.AuthResponse response(User user) {
        return new AuthDtos.AuthResponse(jwtService.create(user),
                new AuthDtos.UserProfile(user.getId(), user.getEmail(), user.getDisplayName(), user.getRole()));
    }
}

