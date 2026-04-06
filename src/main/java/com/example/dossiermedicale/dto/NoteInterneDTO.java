package com.example.dossiermedicale.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NoteInterneDTO {

    private Long idNoteInterne;

    @NotNull(message = "L'ID du dossier médical est obligatoire")
    private Long idDossierMedical;

    @NotBlank(message = "Le contenu est obligatoire")
    private String contenu;

    private LocalDateTime dateCreation;
    private String medecinNom;
}
