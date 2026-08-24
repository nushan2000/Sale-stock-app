package com.example.salesstock.dto;

import com.example.salesstock.entity.AppUser;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserDto {
    private Long id;

    @NotBlank(message = "Username is required")
    private String username;

    // Only required/used on create; ignored on role/active updates.
    private String password;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotNull(message = "Role is required")
    private AppUser.Role role;

    private Boolean active;
}
