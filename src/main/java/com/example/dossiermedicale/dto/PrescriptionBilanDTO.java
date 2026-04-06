package com.example.dossiermedicale.dto;

import com.example.dossiermedicale.Enum.StatutPrescription;
import com.example.dossiermedicale.Enum.TypeBilan;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionBilanDTO {
    private Long id;
    @NotNull private Long dossierId;
    @NotNull private Long medecinId;
    @NotNull private LocalDateTime datePrescription;
    private TypeBilan typeBilan;
    private List<String> examens;
    private Boolean urgence;
    private Long laboId;
    private StatutPrescription statut;
    private String noteClinique;
}
