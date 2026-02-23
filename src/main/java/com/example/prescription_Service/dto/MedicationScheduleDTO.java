package com.example.prescription_Service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MedicationScheduleDTO {

    private Long id;
    private Long prescriptionItemId;
    private LocalTime scheduledTime;
}