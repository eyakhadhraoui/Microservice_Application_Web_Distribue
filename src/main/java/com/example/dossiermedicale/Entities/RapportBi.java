package com.example.dossiermedicale.Entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Rapport de bilan : lié au dossier et à une liste de ResultatLaboratoire (quels résultats sont inclus).
 * partagePatient contrôle ce que la famille peut voir.
 */
@Entity
@Table(name = "rapport_bi")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RapportBi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idRapportBilan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idDossierMedical", nullable = false)
    private DossierMedical dossierMedical;

    /** Historique : un rapport pouvait être lié à un seul résultat ; conservé pour compatibilité. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idResultatLaboratoire")
    private ResultatLaboratoire resultatLaboratoire;

    /** Liste des résultats inclus dans ce rapport (relation Rapport → ResultatLaboratoire). */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "rapport_bi_resultats",
            joinColumns = @JoinColumn(name = "id_rapport_bi"),
            inverseJoinColumns = @JoinColumn(name = "id_resultat_laboratoire")
    )
    @Builder.Default
    private List<ResultatLaboratoire> resultats = new ArrayList<>();

    @Column(nullable = false)
    private LocalDate dateRapport;

    @Column(columnDefinition = "TEXT")
    private String contenu;

    @Column(columnDefinition = "TEXT")
    private String conclusion;

    @Column(columnDefinition = "TEXT")
    private String recommandations;

    @Column(length = 512)
    private String cheminPdf;

    @Column(columnDefinition = "LONGTEXT")
    private String signatureBase64;

    private LocalDateTime dateSignature;

    @Column(length = 255)
    private String nomMedecin;

    /** La famille peut-elle voir ce rapport ? */
    @Column(name = "partage_patient", nullable = false)
    @Builder.Default
    private Boolean partagePatient = false;
}
