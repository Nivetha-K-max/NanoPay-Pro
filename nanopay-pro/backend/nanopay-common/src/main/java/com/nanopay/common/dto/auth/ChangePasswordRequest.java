package com.nanopay.common.dto.auth;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ChangePasswordRequest {

    @NotBlank
    private String currentPassword;

    @NotBlank
    @Size(min = 8, max = 72)
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&\\-_])[A-Za-z\\d@$!%*?&\\-_]{8,}$",
        message = "Password must contain at least one uppercase, lowercase, digit, and special character"
    )
    private String newPassword;

    @NotBlank
    private String confirmPassword;
}
