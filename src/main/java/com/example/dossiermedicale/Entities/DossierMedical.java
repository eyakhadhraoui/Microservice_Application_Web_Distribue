package com.example.dossiermedicale.Entities;

import com.example.dossiermedicale.Enum.Diagnostic;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Dossier médical patient. Poids, taille, IMC (ex-ParametreVital) sont ici — pas liés à un résultat labo.
 */
@Entity
@Table(name = "dossier_medical")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"consultations", "suivis", "testsLaboratoire", "imagesMedicales"})
@EqualsAndHashCode(exclude = {"consultations", "suivis", "testsLaboratoire", "imagesMedicales"})
public class DossierMedical {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idDossierMedical;

    @Column(nullable = false)
    private Long idPatient;

    @Column(nullable = false)
    private LocalDate dateCreation;

    @Column(nullable = false)
    private Long idMedecin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 100)
    private Diagnostic diagnostic;

    @Column(columnDefinition = "TEXT")
    private String notes;

    /** Poids (kg) — ex-ParametreVital, dernier connu. */
    @Column(precision = 5, scale = 2)
    private BigDecimal poids;

    /** Taille (cm) — ex-ParametreVital. */
    @Column(precision = 5, scale = 2)
    private BigDecimal taille;

    /** IMC calculé ou saisi — ex-ParametreVital. */
    @Column(precision = 5, scale = 2)
    private BigDecimal imc;

    @OneToMany(mappedBy = "dossierMedical", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Suivi> suivis = new ArrayList<>();

    @OneToMany(mappedBy = "dossierMedical", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ImageMedicale> imagesMedicales = new ArrayList<>();
}
