package com.example.dossiermedicale.Entities;

import com.example.dossiermedicale.Enum.StatutSuivi;
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

    /** Pièce jointe (PDF ou image) : chemin relatif ex. uploads/suivis/xxx.pdf */
    @Column(length = 500)
    private String cheminPieceJointe;
}