package com.example.dossiermedicale.Entities;

import com.example.dossiermedicale.Enum.StatutPrescription;
import com.example.dossiermedicale.Enum.TypeBilan;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Prescription de bilan : le médecin sélectionne les examens (codes LOINC), précise l'urgence, envoie au labo.
 * Statut EN_ATTENTE à la création.
 */
@Entity
@Table(name = "prescription_bilan")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionBilan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dossier_id", nullable = false)
    private Long dossierId;

    @Column(name = "medecin_id", nullable = false)
    private Long medecinId;

    @Column(nullable = false)
    private LocalDateTime datePrescription;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_bilan", length = 50)
    private TypeBilan typeBilan;

    /** Codes LOINC des examens demandés (liste dans table d'association). */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "prescription_bilan_examens", joinColumns = @JoinColumn(name = "prescription_id"))
    @Column(name = "code_loinc", length = 20)
    @Builder.Default
    private List<String> examens = new ArrayList<>();

    @Column(nullable = false)
    @Builder.Default
    private Boolean urgence = false;

    /** Laboratoire désigné (référence externe). */
    @Column(name = "labo_id")
    private Long laboId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StatutPrescription statut = StatutPrescription.EN_ATTENTE;

    @Column(name = "note_clinique", columnDefinition = "TEXT")
    private String noteClinique;
}
