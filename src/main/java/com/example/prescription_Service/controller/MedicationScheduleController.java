package com.example.prescription_Service.controller;

import com.example.prescription_Service.dto.MedicationScheduleDTO;
import com.example.prescription_Service.service.MedicationScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medication-schedules")
@RequiredArgsConstructor
public class MedicationScheduleController {

    private final MedicationScheduleService medicationScheduleService;

    // Récupérer les horaires d'un PrescriptionItem
    @GetMapping("/prescription-item/{prescriptionItemId}")
    public ResponseEntity<List<MedicationScheduleDTO>> getByPrescriptionItem(
            @PathVariable Long prescriptionItemId) {
        return ResponseEntity.ok(
                medicationScheduleService.getByPrescriptionItem(prescriptionItemId)
        );
    }

    // Supprimer les horaires d'un PrescriptionItem
    @DeleteMapping("/prescription-item/{prescriptionItemId}")
    public ResponseEntity<Void> deleteByPrescriptionItem(
            @PathVariable Long prescriptionItemId) {
        medicationScheduleService.deleteByPrescriptionItem(prescriptionItemId);
        return ResponseEntity.noContent().build();
    }
}