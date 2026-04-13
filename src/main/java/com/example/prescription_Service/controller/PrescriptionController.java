package com.example.prescription_Service.controller;

import com.example.prescription_Service.dto.PrescriptionDTO;
import com.example.prescription_Service.service.PrescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    // Créer une prescription
    @PostMapping
    public ResponseEntity<PrescriptionDTO> create(@Valid @RequestBody PrescriptionDTO prescriptionDTO) {
        PrescriptionDTO created = prescriptionService.createPrescription(prescriptionDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // Récupérer toutes les prescriptions
    @GetMapping
    public ResponseEntity<List<PrescriptionDTO>> getAll() {
        List<PrescriptionDTO> prescriptions = prescriptionService.getAllPrescriptions();
        return ResponseEntity.ok(prescriptions);
    }

    // Récupérer une prescription par ID
    @GetMapping("/{id}")
    public ResponseEntity<PrescriptionDTO> getById(@PathVariable Long id) {
        PrescriptionDTO prescription = prescriptionService.getPrescriptionById(id);
        return ResponseEntity.ok(prescription);
    }


    // Récupérer les prescriptions récentes d'un patient
    @GetMapping("/medical-record/{medicalRecordId}/recent")
    public ResponseEntity<List<PrescriptionDTO>> getRecentByMedicalRecord(@PathVariable Long medicalRecordId) {
        List<PrescriptionDTO> prescriptions = prescriptionService.getRecentPrescriptionsByMedicalRecord(medicalRecordId);
        return ResponseEntity.ok(prescriptions);
    }

    // Récupérer les prescriptions entre deux dates
    @GetMapping("/date-range")
    public ResponseEntity<List<PrescriptionDTO>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<PrescriptionDTO> prescriptions = prescriptionService.getPrescriptionsBetweenDates(startDate, endDate);
        return ResponseEntity.ok(prescriptions);
    }

    // Mettre à jour une prescription
    @PutMapping("/{id}")
    public ResponseEntity<PrescriptionDTO> update(@PathVariable Long id,
                                                  @Valid @RequestBody PrescriptionDTO prescriptionDTO) {
        PrescriptionDTO updated = prescriptionService.updatePrescription(id, prescriptionDTO);
        return ResponseEntity.ok(updated);
    }

    // Supprimer une prescription
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        prescriptionService.deletePrescription(id);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/medical-record/{medicalRecordId}")
    public List<PrescriptionDTO> getByMedicalRecord(
            @PathVariable Long medicalRecordId) {

        return prescriptionService.getByMedicalRecord(medicalRecordId);
    }
    @GetMapping("/medical-record/{medicalRecordId}/active")
    public ResponseEntity<List<PrescriptionDTO>> getActivePrescriptions(
            @PathVariable Long medicalRecordId) {
        return ResponseEntity.ok(
                prescriptionService.getActivePrescriptions(medicalRecordId)
        );
    }
    // Récupérer les prescriptions actives par patientId
    @GetMapping("/patient/{patientId}/active")
    public ResponseEntity<List<PrescriptionDTO>> getActiveByPatient(
            @PathVariable Long patientId) {
        return ResponseEntity.ok(
                prescriptionService.getActivePrescriptions(patientId)
        );
    }

    // Récupérer toutes les prescriptions par patientId
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<PrescriptionDTO>> getByPatient(
            @PathVariable Long patientId) {
        return ResponseEntity.ok(
                prescriptionService.getByPatientId(patientId)
        );
    }
}