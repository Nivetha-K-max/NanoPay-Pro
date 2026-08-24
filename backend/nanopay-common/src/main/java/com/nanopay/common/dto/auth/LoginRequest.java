package com.nanopay.common.dto.auth;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(max = 72, message = "Password too long")  // BCrypt silently truncates at 72
    private String password;
}
