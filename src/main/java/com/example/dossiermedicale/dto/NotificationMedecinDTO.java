package com.example.dossiermedicale.dto;

import com.example.dossiermedicale.Enum.TypeNotificationMedecin;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationMedecinDTO {

    private Long idNotificationMedecin;
    private Long idMedecin;
    private Long idDossierMedical;
    private Long idPatient;
    private String patientName;
    private TypeNotificationMedecin type;
    private String titre;
    private String message;
    private Long idResultatLaboratoire;
    private Boolean lu;
    private LocalDateTime dateCreation;
    /** Sévérité pour l'affichage (CRITICAL pour médicament non pris). */
    private String severity;
}
