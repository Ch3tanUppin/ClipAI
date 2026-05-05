package com.clipai.api.auth;

import com.clipai.api.user.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public final class AuthDtos {
    private AuthDtos() {}

    public record SignupRequest(
            @Email @NotBlank String email,
            @NotBlank @Size(min = 8, max = 120) String password,
            @NotBlank @Size(max = 120) String displayName
    ) {}

    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}

    public record AuthResponse(String token, UserProfile user) {}

    public record UserProfile(UUID id, String email, String displayName, UserRole role) {}
}

