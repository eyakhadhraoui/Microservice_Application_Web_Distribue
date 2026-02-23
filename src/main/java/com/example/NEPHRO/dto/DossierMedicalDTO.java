package com.example.NEPHRO.dto;

import com.example.NEPHRO.Enum.Diagnostic;
import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DossierMedicalDTO {
    private Long idDossierMedical;
    private Long idPatient;    // ← ID du patient
    private Long idMedecin;    // ← ID du médecin
    private LocalDate dateCreation;
    private Diagnostic diagnostic;
    private String notes;
}