package com.example.dossiermedicale.Controllers;

import com.example.dossiermedicale.Services.DossierMedicalService;
import com.example.dossiermedicale.Services.PatientService;
import com.example.dossiermedicale.dto.DossierMedicalDTO;
import com.example.dossiermedicale.Enum.Diagnostic;
import com.example.dossiermedicale.util.BearerTokenPayloadReader;
import jakarta.servlet.http.HttpServletRequest;
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
    private final PatientService patientService;

    // CREATE - Créer un nouveau dossier médical
    @PostMapping
    public ResponseEntity<DossierMedicalDTO> createDossier(@Valid @RequestBody DossierMedicalDTO dossierDTO) {
        DossierMedicalDTO createdDossier = dossierMedicalService.createDossier(dossierDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdDossier);
    }

    // UPDATE - Mettre à jour un dossier médical
    @PutMapping("/{id}")
    public ResponseEntity<DossierMedicalDTO> updateDossier(
            @PathVariable Long id,
            @Valid @RequestBody DossierMedicalDTO dossierDTO) {
        DossierMedicalDTO updatedDossier = dossierMedicalService.updateDossier(id, dossierDTO);
        return ResponseEntity.ok(updatedDossier);
    }

    // GET BY ID - Récupérer un dossier par son ID
    @GetMapping("/{id}")
    public ResponseEntity<DossierMedicalDTO> getDossierById(@PathVariable Long id) {
        DossierMedicalDTO dossier = dossierMedicalService.getDossierById(id);
        return ResponseEntity.ok(dossier);
    }

    // GET ALL - Récupérer tous les dossiers
    @GetMapping
    public ResponseEntity<List<DossierMedicalDTO>> getAllDossiers() {
        List<DossierMedicalDTO> dossiers = dossierMedicalService.getAllDossiers();
        return ResponseEntity.ok(dossiers);
    }

    /** Dossiers du patient connecté (JWT → username → Patient → idPatient → dossiers). */
    @GetMapping("/mes-dossiers")
    public ResponseEntity<?> getMesDossiers(HttpServletRequest request) {
        var usernameOpt = BearerTokenPayloadReader.preferredUsername(request);
        if (usernameOpt.isEmpty()) {
            return ResponseEntity.status(401).build();
        }
        String username = usernameOpt.get();
        if (username.isBlank()) {
            return ResponseEntity.status(400).build();
        }
        try {
            Long idPatient = patientService.getByUsername(username).getIdPatient();
            List<DossierMedicalDTO> dossiers = dossierMedicalService.getDossiersByPatient(idPatient);
            return ResponseEntity.ok(dossiers);
        } catch (RuntimeException e) {
            return ResponseEntity.ok(List.of());
        }
    }

    // GET BY PATIENT - Récupérer les dossiers d'un patient
    @GetMapping("/patient/{idPatient}")
    public ResponseEntity<List<DossierMedicalDTO>> getDossiersByPatient(@PathVariable Long idPatient) {
        List<DossierMedicalDTO> dossiers = dossierMedicalService.getDossiersByPatient(idPatient);
        return ResponseEntity.ok(dossiers);
    }

    // GET BY MEDECIN - Récupérer les dossiers d'un médecin
    @GetMapping("/medecin/{idMedecin}")
    public ResponseEntity<List<DossierMedicalDTO>> getDossiersByMedecin(@PathVariable Long idMedecin) {
        List<DossierMedicalDTO> dossiers = dossierMedicalService.getDossiersByMedecin(idMedecin);
        return ResponseEntity.ok(dossiers);
    }

    // GET BY DIAGNOSTIC - Récupérer les dossiers par diagnostic
    @GetMapping("/diagnostic/{diagnostic}")
    public ResponseEntity<List<DossierMedicalDTO>> getDossiersByDiagnostic(@PathVariable Diagnostic diagnostic) {
        List<DossierMedicalDTO> dossiers = dossierMedicalService.getDossiersByDiagnostic(diagnostic);
        return ResponseEntity.ok(dossiers);
    }

    // GET BY MEDECIN AND DIAGNOSTIC - Récupérer les dossiers par médecin et diagnostic
    @GetMapping("/medecin/{idMedecin}/diagnostic/{diagnostic}")
    public ResponseEntity<List<DossierMedicalDTO>> getDossiersByMedecinAndDiagnostic(
            @PathVariable Long idMedecin,
            @PathVariable Diagnostic diagnostic) {
        List<DossierMedicalDTO> dossiers = dossierMedicalService.getDossiersByMedecinAndDiagnostic(idMedecin, diagnostic);
        return ResponseEntity.ok(dossiers);
    }

    // GET BY DATE RANGE - Récupérer les dossiers par période
    @GetMapping("/dates")
    public ResponseEntity<List<DossierMedicalDTO>> getDossiersByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        List<DossierMedicalDTO> dossiers = dossierMedicalService.getDossiersByDateRange(dateDebut, dateFin);
        return ResponseEntity.ok(dossiers);
    }

    // GET BY MEDECIN AND DATE RANGE - Récupérer les dossiers par médecin et période
    @GetMapping("/medecin/{idMedecin}/dates")
    public ResponseEntity<List<DossierMedicalDTO>> getDossiersByMedecinAndDateRange(
            @PathVariable Long idMedecin,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        List<DossierMedicalDTO> dossiers = dossierMedicalService.getDossiersByMedecinAndDateRange(idMedecin, dateDebut, dateFin);
        return ResponseEntity.ok(dossiers);
    }

    // DELETE - Supprimer un dossier
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDossier(@PathVariable Long id) {
        dossierMedicalService.deleteDossier(id);
        return ResponseEntity.noContent().build();
    }

    // COUNT BY MEDECIN - Compter les dossiers d'un médecin
    @GetMapping("/medecin/{idMedecin}/count")
    public ResponseEntity<Long> countDossiersByMedecin(@PathVariable Long idMedecin) {
        long count = dossierMedicalService.countDossiersByMedecin(idMedecin);
        return ResponseEntity.ok(count);
    }

    // COUNT BY PATIENT - Compter les dossiers d'un patient
    @GetMapping("/patient/{idPatient}/count")
    public ResponseEntity<Long> countDossiersByPatient(@PathVariable Long idPatient) {
        long count = dossierMedicalService.countDossiersByPatient(idPatient);
        return ResponseEntity.ok(count);
    }

    // EXISTS - Vérifier si un dossier existe
    @GetMapping("/{id}/exists")
    public ResponseEntity<Boolean> existsDossier(@PathVariable Long id) {
        boolean exists = dossierMedicalService.existsDossier(id);
        return ResponseEntity.ok(exists);
    }
}
