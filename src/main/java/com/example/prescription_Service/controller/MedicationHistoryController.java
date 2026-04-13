package com.example.prescription_Service.controller;

import com.example.prescription_Service.dto.MedicationHistoryDTO;
import com.example.prescription_Service.entity.MedicationHistory;
import com.example.prescription_Service.service.MedicationHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/medication-history")
@RequiredArgsConstructor
public class MedicationHistoryController {

    private final MedicationHistoryService medicationHistoryService;

    // Enregistrer une prise
    @PostMapping
    public ResponseEntity<MedicationHistoryDTO> create(@Valid @RequestBody MedicationHistoryDTO medicationHistoryDTO) {
        MedicationHistoryDTO created = medicationHistoryService.createMedicationHistory(medicationHistoryDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // Récupérer tout l'historique
    @GetMapping
    public ResponseEntity<List<MedicationHistoryDTO>> getAll() {
        List<MedicationHistoryDTO> history = medicationHistoryService.getAllMedicationHistory();
        return ResponseEntity.ok(history);
    }

    // Récupérer un enregistrement par ID
    @GetMapping("/{id}")
    public ResponseEntity<MedicationHistoryDTO> getById(@PathVariable Long id) {
        MedicationHistoryDTO history = medicationHistoryService.getMedicationHistoryById(id);
        return ResponseEntity.ok(history);
    }

    // Récupérer l'historique d'un patient
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<MedicationHistoryDTO>> getByPatientId(@PathVariable Long patientId) {
        List<MedicationHistoryDTO> history = medicationHistoryService.getByPatientId(patientId);
        return ResponseEntity.ok(history);
    }

    // Récupérer l'historique d'un prescription item
    @GetMapping("/prescription-item/{prescriptionItemId}")
    public ResponseEntity<List<MedicationHistoryDTO>> getByPrescriptionItemId(@PathVariable Long prescriptionItemId) {
        List<MedicationHistoryDTO> history = medicationHistoryService.getByPrescriptionItemId(prescriptionItemId);
        return ResponseEntity.ok(history);
    }

    // Récupérer par statut
    @GetMapping("/status/{status}")
    public ResponseEntity<List<MedicationHistoryDTO>> getByStatus(@PathVariable String status) {
        List<MedicationHistoryDTO> history = medicationHistoryService.getByStatus(status);
        return ResponseEntity.ok(history);
    }

    // Récupérer les prises d'un patient par statut
    @GetMapping("/patient/{patientId}/status/{status}")
    public ResponseEntity<List<MedicationHistoryDTO>> getByPatientIdAndStatus(
            @PathVariable Long patientId,
            @PathVariable String status) {
        List<MedicationHistoryDTO> history = medicationHistoryService.getByPatientIdAndStatus(patientId, status);
        return ResponseEntity.ok(history);
    }

    // Récupérer l'historique entre deux dates
    @GetMapping("/date-range")
    public ResponseEntity<List<MedicationHistoryDTO>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        List<MedicationHistoryDTO> history = medicationHistoryService.getHistoryBetweenDates(startDate, endDate);
        return ResponseEntity.ok(history);
    }

    // Récupérer l'historique d'un patient entre deux dates
    @GetMapping("/patient/{patientId}/date-range")
    public ResponseEntity<List<MedicationHistoryDTO>> getPatientHistoryByDateRange(
            @PathVariable Long patientId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        List<MedicationHistoryDTO> history = medicationHistoryService.getPatientHistoryBetweenDates(patientId, startDate, endDate);
        return ResponseEntity.ok(history);
    }

    // Récupérer les prises avec effets secondaires
    @GetMapping("/side-effects")
    public ResponseEntity<List<MedicationHistoryDTO>> getWithSideEffects() {
        List<MedicationHistoryDTO> history = medicationHistoryService.getWithSideEffects();
        return ResponseEntity.ok(history);
    }

    // Récupérer les prises avec effets secondaires pour un patient
    @GetMapping("/patient/{patientId}/side-effects")
    public ResponseEntity<List<MedicationHistoryDTO>> getPatientHistoryWithSideEffects(@PathVariable Long patientId) {
        List<MedicationHistoryDTO> history = medicationHistoryService.getPatientHistoryWithSideEffects(patientId);
        return ResponseEntity.ok(history);
    }

    // Calculer le taux d'observance
    @GetMapping("/patient/{patientId}/compliance")
    public ResponseEntity<Double> getComplianceRate(
            @PathVariable Long patientId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        double complianceRate = medicationHistoryService.calculateComplianceRate(patientId, startDate, endDate);
        return ResponseEntity.ok(complianceRate);
    }

    // Mettre à jour un enregistrement
    @PutMapping("/{id}")
    public ResponseEntity<MedicationHistoryDTO> update(@PathVariable Long id,
                                                       @Valid @RequestBody MedicationHistoryDTO medicationHistoryDTO) {
        MedicationHistoryDTO updated = medicationHistoryService.updateMedicationHistory(id, medicationHistoryDTO);
        return ResponseEntity.ok(updated);
    }

    // Supprimer un enregistrement
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        medicationHistoryService.deleteMedicationHistory(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/patient/{patientId}/late-doses")
    public ResponseEntity<List<MedicationHistory>> getLateDoses(
            @PathVariable Long patientId) {

        return ResponseEntity.ok(
                medicationHistoryService.getLateDoses(patientId)
        );
    }
}