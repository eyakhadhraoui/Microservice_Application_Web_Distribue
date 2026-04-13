package com.example.prescription_Service.controller;

import com.example.prescription_Service.dto.DosageAdjustmentDTO;
import com.example.prescription_Service.service.DosageAdjustmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dosage-adjustments")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class DosageAdjustmentController {

    private final DosageAdjustmentService service;

    // ── GET /api/dosage-adjustments/pending ──────────────────────
    // Toutes les suggestions en attente pour le dashboard médecin
    @GetMapping("/pending")
    public ResponseEntity<List<DosageAdjustmentDTO>> getPending() {
        return ResponseEntity.ok(service.getPendingAdjustments());
    }

    // ── GET /api/dosage-adjustments/count ────────────────────────
    // Nombre de suggestions PENDING (badge dashboard)
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getCount() {
        return ResponseEntity.ok(Map.of("pending", service.countPending()));
    }

    // ── POST /api/dosage-adjustments/weight ──────────────────────
    // Saisir un nouveau poids → déclenche le calcul automatique
    // Body: { "patientId": 101, "weightKg": 25.0 }
    @PostMapping("/weight")
    public ResponseEntity<Map<String, String>> recordWeight(
            @RequestBody Map<String, Object> body) {
        Long   patientId = Long.valueOf(body.get("patientId").toString());
        Double weightKg  = Double.valueOf(body.get("weightKg").toString());
        service.recordWeight(patientId, weightKg);
        return ResponseEntity.ok(Map.of("status", "Poids enregistré, vérification effectuée"));
    }

    // ── PUT /api/dosage-adjustments/{id}/approve ─────────────────
    // Médecin approuve → PrescriptionItem mis à jour automatiquement
    // Body: { "doctorName": "Dr. Sarah Dupont" }
    @PutMapping("/{id}/approve")
    public ResponseEntity<DosageAdjustmentDTO> approve(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String doctorName = body.getOrDefault("doctorName", "Dr. Dupont");
        return ResponseEntity.ok(service.approve(id, doctorName));
    }

    // ── PUT /api/dosage-adjustments/{id}/reject ──────────────────
    // Médecin refuse → status = REJECTED
    // Body: { "doctorName": "Dr. Sarah Dupont" }
    @PutMapping("/{id}/reject")
    public ResponseEntity<DosageAdjustmentDTO> reject(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String doctorName = body.getOrDefault("doctorName", "Dr. Dupont");
        return ResponseEntity.ok(service.reject(id, doctorName));
    }
}