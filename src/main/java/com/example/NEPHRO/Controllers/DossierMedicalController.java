package com.example.NEPHRO.Controllers;

import com.example.NEPHRO.Enum.Diagnostic;
import com.example.NEPHRO.Services.DossierMedicalService;
import com.example.NEPHRO.dto.DossierMedicalDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dossiers-medicaux")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DossierMedicalController {

    private final DossierMedicalService dossierMedicalService;

    // CREATE
    @PostMapping
    public ResponseEntity<DossierMedicalDTO> createDossier(@Valid @RequestBody DossierMedicalDTO dossierDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(dossierMedicalService.createDossier(dossierDTO));
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<DossierMedicalDTO> updateDossier(@PathVariable Long id, @Valid @RequestBody DossierMedicalDTO dossierDTO) {
        return ResponseEntity.ok(dossierMedicalService.updateDossier(id, dossierDTO));
    }

    // GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<DossierMedicalDTO> getDossierById(@PathVariable Long id) {
        return ResponseEntity.ok(dossierMedicalService.getDossierById(id));
    }

    // GET ALL
    @GetMapping
    public ResponseEntity<List<DossierMedicalDTO>> getAllDossiers() {
        return ResponseEntity.ok(dossierMedicalService.getAllDossiers());
    }

    // GET BY PATIENT
    @GetMapping("/patient/{idPatient}")
    public ResponseEntity<List<DossierMedicalDTO>> getDossiersByPatient(@PathVariable Long idPatient) {
        return ResponseEntity.ok(dossierMedicalService.getDossiersByPatient(idPatient));
    }

    // GET BY MEDECIN
    @GetMapping("/medecin/{idMedecin}")
    public ResponseEntity<List<DossierMedicalDTO>> getDossiersByMedecin(@PathVariable Long idMedecin) {
        return ResponseEntity.ok(dossierMedicalService.getDossiersByMedecin(idMedecin));
    }

    // GET BY DIAGNOSTIC
    @GetMapping("/diagnostic/{diagnostic}")
    public ResponseEntity<List<DossierMedicalDTO>> getDossiersByDiagnostic(@PathVariable Diagnostic diagnostic) {
        return ResponseEntity.ok(dossierMedicalService.getDossiersByDiagnostic(diagnostic));
    }

    // GET BY MEDECIN AND DIAGNOSTIC
    @GetMapping("/medecin/{idMedecin}/diagnostic/{diagnostic}")
    public ResponseEntity<List<DossierMedicalDTO>> getDossiersByMedecinAndDiagnostic(
            @PathVariable Long idMedecin, @PathVariable Diagnostic diagnostic) {
        return ResponseEntity.ok(dossierMedicalService.getDossiersByMedecinAndDiagnostic(idMedecin, diagnostic));
    }

    // GET BY DATE RANGE
    @GetMapping("/dates")
    public ResponseEntity<List<DossierMedicalDTO>> getDossiersByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        return ResponseEntity.ok(dossierMedicalService.getDossiersByDateRange(dateDebut, dateFin));
    }

    // GET BY MEDECIN AND DATE RANGE
    @GetMapping("/medecin/{idMedecin}/dates")
    public ResponseEntity<List<DossierMedicalDTO>> getDossiersByMedecinAndDateRange(
            @PathVariable Long idMedecin,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        return ResponseEntity.ok(dossierMedicalService.getDossiersByMedecinAndDateRange(idMedecin, dateDebut, dateFin));
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDossier(@PathVariable Long id) {
        dossierMedicalService.deleteDossier(id);
        return ResponseEntity.noContent().build();
    }

    // COUNT BY MEDECIN
    @GetMapping("/medecin/{idMedecin}/count")
    public ResponseEntity<Long> countDossiersByMedecin(@PathVariable Long idMedecin) {
        return ResponseEntity.ok(dossierMedicalService.countDossiersByMedecin(idMedecin));
    }

    // COUNT BY PATIENT
    @GetMapping("/patient/{idPatient}/count")
    public ResponseEntity<Long> countDossiersByPatient(@PathVariable Long idPatient) {
        return ResponseEntity.ok(dossierMedicalService.countDossiersByPatient(idPatient));
    }

    // EXISTS
    @GetMapping("/{id}/exists")
    public ResponseEntity<Boolean> existsDossier(@PathVariable Long id) {
        return ResponseEntity.ok(dossierMedicalService.existsDossier(id));
    }
}