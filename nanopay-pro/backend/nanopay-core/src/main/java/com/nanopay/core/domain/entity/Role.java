package com.nanopay.core.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "roles")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;  // "ROLE_ADMIN", "ROLE_MERCHANT", "ROLE_CUSTOMER"

    @Column(length = 255)
    private String description;

    // Convenience factory — avoids scattered "new Role()" with field sets
    public static Role of(String name) {
        Role role = new Role();
        role.name = name;
        return role;
    }
}
