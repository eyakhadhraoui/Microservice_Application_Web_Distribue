package com.example.dossiermedicale.dto;
import com.example.dossiermedicale.Enum.TypeImageMedicale;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImageMedicaleDTO {

    private Long idImage;

    @NotNull(message = "L'ID du dossier médical est obligatoire")
    private Long idDossierMedical;

    @NotNull(message = "Le type d'image est obligatoire")
    private TypeImageMedicale typeImage;

    @NotBlank(message = "Le chemin de l'image est obligatoire")
    private String cheminImage;

    @NotNull(message = "La date de capture est obligatoire")
    @PastOrPresent(message = "La date de capture ne peut pas être dans le futur")
    private LocalDate  dateCapture;

    private String description;
}
