package com.example.prescription_Service.controller;

import com.example.prescription_Service.entity.PatientWeight;
import com.example.prescription_Service.repository.PatientWeightRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patient-weight")
@RequiredArgsConstructor
public class PatientWeightController {

    private final PatientWeightRepository repo;

    /** Dernier poids enregistré pour un patient */
    @GetMapping("/patient/{patientId}/latest")
    public ResponseEntity<PatientWeight> getLatest(@PathVariable Long patientId) {
        return repo.findTopByPatientIdOrderByMeasuredAtDesc(patientId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Historique complet */
    @GetMapping("/patient/{patientId}")
    public List<PatientWeight> getHistory(@PathVariable Long patientId) {
        return repo.findByPatientIdOrderByMeasuredAtDesc(patientId);
    }

    /** Ajouter un poids */
    @PostMapping
    public PatientWeight create(@RequestBody PatientWeight pw) {
        return repo.save(pw);
    }
}
