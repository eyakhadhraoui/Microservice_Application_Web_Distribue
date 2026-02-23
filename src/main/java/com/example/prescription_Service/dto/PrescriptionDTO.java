package com.example.prescription_Service.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionDTO {

    private Long id;

    @NotNull(message = "L'ID du dossier médical est obligatoire")
    private Long medicalRecordId;

    @NotNull(message = "La date de prescription est obligatoire")
    @PastOrPresent(message = "La date de prescription ne peut pas être dans le futur")
    private LocalDate prescriptionDate;

    private String notes;
}