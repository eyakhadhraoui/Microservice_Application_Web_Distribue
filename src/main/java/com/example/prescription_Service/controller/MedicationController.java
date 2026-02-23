package com.example.prescription_Service.controller;

import com.example.prescription_Service.dto.MedicationDTO;
import com.example.prescription_Service.service.MedicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medications")
@RequiredArgsConstructor
public class MedicationController {

    private final MedicationService medicationService;

    // Créer un nouveau médicament
    @PostMapping
    public ResponseEntity<MedicationDTO> create(@Valid @RequestBody MedicationDTO medicationDTO) {
        MedicationDTO created = medicationService.createMedication(medicationDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // Récupérer tous les médicaments
    @GetMapping
    public ResponseEntity<List<MedicationDTO>> getAll() {
        List<MedicationDTO> medications = medicationService.getAllMedications();
        return ResponseEntity.ok(medications);
    }

    // Récupérer un médicament par ID
    @GetMapping("/{id}")
    public ResponseEntity<MedicationDTO> getById(@PathVariable Long id) {
        MedicationDTO medication = medicationService.getMedicationById(id);
        return ResponseEntity.ok(medication);
    }

    // Rechercher par nom
    @GetMapping("/search/name")
    public ResponseEntity<List<MedicationDTO>> searchByName(@RequestParam String name) {
        List<MedicationDTO> medications = medicationService.searchByName(name);
        return ResponseEntity.ok(medications);
    }

    // Rechercher par catégorie
    @GetMapping("/category/{category}")
    public ResponseEntity<List<MedicationDTO>> getByCategory(@PathVariable String category) {
        List<MedicationDTO> medications = medicationService.getByCategory(category);
        return ResponseEntity.ok(medications);
    }

    // Rechercher les médicaments nécessitant surveillance
    @GetMapping("/monitoring")
    public ResponseEntity<List<MedicationDTO>> getMedicationsRequiringMonitoring() {
        List<MedicationDTO> medications = medicationService.getMedicationsRequiringMonitoring();
        return ResponseEntity.ok(medications);
    }

    // Rechercher par principe actif
    @GetMapping("/search/active-ingredient")
    public ResponseEntity<List<MedicationDTO>> searchByActiveIngredient(@RequestParam String activeIngredient) {
        List<MedicationDTO> medications = medicationService.searchByActiveIngredient(activeIngredient);
        return ResponseEntity.ok(medications);
    }

    // Mettre à jour un médicament
    @PutMapping("/{id}")
    public ResponseEntity<MedicationDTO> update(@PathVariable Long id,
                                                @Valid @RequestBody MedicationDTO medicationDTO) {
        MedicationDTO updated = medicationService.updateMedication(id, medicationDTO);
        return ResponseEntity.ok(updated);
    }

    // Supprimer un médicament
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        medicationService.deleteMedication(id);
        return ResponseEntity.noContent().build();
    }
}