package com.example.prescription_Service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoctorAlertDTO {
    private Long id;
    private Long patientId;
    private Long prescriptionItemId;
    private String medicationName;
    private Boolean isImmunosuppressor;
    private String alertType;
    private String severity;
    private String message;
    private Integer missedDaysCount;
    private LocalDateTime triggeredAt;
    private Boolean isRead;
}
