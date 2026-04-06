package com.example.dossiermedicale.dto;

import com.example.dossiermedicale.Enum.TypeExpediteur;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageDTO {

    private Long idMessage;

    @NotNull(message = "L'ID du dossier médical est obligatoire")
    private Long idDossierMedical;

    @NotNull(message = "Le type expéditeur est obligatoire")
    private TypeExpediteur typeExpediteur;

    @NotBlank(message = "Le contenu est obligatoire")
    private String contenu;

    private LocalDateTime dateEnvoi;
    private Boolean lu;
    private String expediteurNom;
}
