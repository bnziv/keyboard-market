package com.keyboardmarket.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

@Document(collection = "users")
@Data
public class User {
    @Id
    private String id;

    @NotBlank(message = "Email cannot be empty")
    @Email(message = "Email must be valid")
    @Indexed(unique = true)
    private String email;

    @NotBlank(message = "Username cannot be empty")
    @Pattern(
        regexp = "^[a-zA-Z0-9._-]{3,20}$",
        message = "Username must be 3-20 characters long and can only contain letters, numbers, '.', '_', and '-'"
    )
    @Indexed(unique = true)
    private String username;

    @NotBlank(message = "Password cannot be empty")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String password;
}
