package com.example.prescription_Service.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionDTO {

    private Long id;

    @NotNull(message = "L'ID du patient est obligatoire")
    private Long patientId;          // ← remplace medicalRecordId

    @NotNull(message = "La date de prescription est obligatoire")
    @PastOrPresent(message = "La date de prescription ne peut pas être dans le futur")
    private LocalDate prescriptionDate;

    private String notes;
    private List<PrescriptionItemDTO> prescriptionItems;

}