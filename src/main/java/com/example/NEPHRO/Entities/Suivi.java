package com.example.NEPHRO.Entities;
import com.example.NEPHRO.Enum.StatutSuivi;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "suivi")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Suivi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idSuivi;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idDossierMedical", nullable = false)
    private DossierMedical dossierMedical;

    @Column(nullable = false)
    private LocalDate dateSuivi;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(length = 255)
    private String objectif;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private StatutSuivi resultat;

    @OneToMany(mappedBy = "suivi", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ImageMedicale> imagesMedicales = new ArrayList<>();
}