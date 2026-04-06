package com.example.dossiermedicale.Entities;

import com.example.dossiermedicale.Enum.TypeNotificationMedecin;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Notification pour le médecin (ex: nouveau test labo ajouté par un patient).
 * Le médecin voit ces notifications sur son dashboard.
 */
@Entity
@Table(name = "notification_medecin", indexes = {
    @Index(name = "idx_notif_medecin_medecin_lu", columnList = "id_medecin, lu"),
    @Index(name = "idx_notif_medecin_date", columnList = "date_creation")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationMedecin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idNotificationMedecin;

    @Column(name = "id_medecin", nullable = false)
    private Long idMedecin;

    @Column(name = "id_dossier_medical", nullable = false)
    private Long idDossierMedical;

    @Column(name = "id_patient")
    private Long idPatient;

    @Column(name = "patient_name", length = 255)
    private String patientName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private TypeNotificationMedecin type;

    @Column(nullable = false, length = 255)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String message;

    /** Référence optionnelle (ex: id du résultat laboratoire) pour lien direct. */
    @Column(name = "id_resultat_laboratoire")
    private Long idResultatLaboratoire;

    @Column(nullable = false)
    private Boolean lu = false;

    @Column(nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();
}
