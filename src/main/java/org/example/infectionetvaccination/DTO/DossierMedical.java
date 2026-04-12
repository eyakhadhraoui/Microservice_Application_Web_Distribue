package org.example.infectionetvaccination.DTO;


import org.example.infectionetvaccination.Enum.Diagnostic;

import java.time.LocalDate;


public class DossierMedical {


    private Long idDossierMedical;

    private Long idPatient;

    private LocalDate dateCreation;


    private Long idMedecin;


    private Diagnostic diagnostic;

    private String notes;

    /** Poids (kg) — ex-ParametreVital. */
    private java.math.BigDecimal poids;
    /** Taille (cm) — ex-ParametreVital. */
    private java.math.BigDecimal taille;
    /** IMC — ex-ParametreVital. */
    private java.math.BigDecimal imc;

    /** Affichage : nom du patient (Prénom Nom). */
    private String patientNom;
    /** Affichage : nom du médecin (Dr. Nom Prénom). */
    private String medecinNom;
}
