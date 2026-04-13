package com.example.prescription_Service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MedicationDTO {

    private Long id;


    @NotBlank(message = "Le nom du médicament est obligatoire")
    @Size(min = 2, max = 100, message = "Le nom doit contenir entre 2 et 100 caractères")
    @Pattern(
            regexp = "^[a-zA-ZÀ-ÿ0-9][a-zA-ZÀ-ÿ0-9 .\\-]{1,99}$",
            message = "Le nom ne doit contenir que des lettres, chiffres, espaces, tirets ou points"
    )
    private String name;


    @NotBlank(message = "Le dosage est obligatoire")
    @Pattern(
            regexp = "^\\d{1,6}(\\.\\d{1,3})?$",
            message = "Le dosage doit être un nombre valide (ex: 500, 2.5)"
    )
    private String dosage;


    @NotBlank(message = "L'unité est obligatoire")
    private String unit;

    @NotBlank(message = "La forme est obligatoire")
    private String form;


    @NotBlank(message = "Le principe actif est obligatoire")
    @Size(min = 2, max = 150, message = "Le principe actif doit contenir entre 2 et 150 caractères")
    @Pattern(
            regexp = "^[a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ0-9 .\\-()]{1,149}$",
            message = "Le principe actif ne doit contenir que des lettres, chiffres, espaces, tirets ou parenthèses"
    )
    private String activeIngredient;

    // Liste déroulante côté front → @Pattern inutile
    @NotBlank(message = "La catégorie est obligatoire")
    private String category;

    @NotNull(message = "La surveillance est obligatoire")
    private Boolean requiresMonitoring;


    @Size(max = 500, message = "Les contre-indications ne peuvent pas dépasser 500 caractères")
    private String contraindications;

}