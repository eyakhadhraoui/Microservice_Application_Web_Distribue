package com.example.prescription_Service.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Médecin (lien avec Keycloak via username).
 * Un dossier médical référence idMedecin.
 */
@Entity
@Table(name = "medecin", indexes = @Index(unique = true, columnList = "username"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Medecin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idMedecin;

    @Column(nullable = false, unique = true, length = 255)
    private String username;

    @Column(nullable = false, length = 120)
    private String nom;

    @Column(length = 120)
    private String prenom;

    @Column(length = 255)
    private String email;
}
