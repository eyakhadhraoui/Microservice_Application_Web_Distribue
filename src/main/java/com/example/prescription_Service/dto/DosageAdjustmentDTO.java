package com.example.prescription_Service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DosageAdjustmentDTO {
    private Long          id;
    private Long          prescriptionItemId;
    private String        medicationName;
    private Long          patientId;
    private Double        currentDose;
    private Double        suggestedDose;
    private Double        weightUsed;
    private Double        previousWeight;
    private Double        percentageChange;
    private String        reason;
    private String        status;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
    private String        reviewedBy;
}