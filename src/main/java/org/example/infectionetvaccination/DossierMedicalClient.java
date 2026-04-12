package org.example.infectionetvaccination;



import org.example.infectionetvaccination.DTO.DossierMedical;
import org.example.infectionetvaccination.Enum.Diagnostic;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@FeignClient(
        name = "dossier-medical-service",
        url = "http://localhost:8089"
)
public interface DossierMedicalClient {

    // ========================
    // BASIC CRUD
    // ========================

    @PostMapping("/api/dossiers-medicaux")
    DossierMedical createDossier(@RequestBody DossierMedical dossierDTO);

    @PutMapping("/api/dossiers-medicaux/{id}")
    DossierMedical updateDossier(@PathVariable Long id,
                                    @RequestBody DossierMedical dossierDTO);

    @GetMapping("/api/dossiers-medicaux/{id}")
    DossierMedical getDossierById(@PathVariable Long id);

    @GetMapping("/api/dossiers-medicaux")
    List<DossierMedical> getAllDossiers();

    @DeleteMapping("/api/dossiers-medicaux/{id}")
    void deleteDossier(@PathVariable Long id);


    // ========================
    // FILTERS
    // ========================

    @GetMapping("/api/dossiers-medicaux/patient/{idPatient}")
    List<DossierMedical> getDossiersByPatient(@PathVariable Long idPatient);

    @GetMapping("/api/dossiers-medicaux/medecin/{idMedecin}")
    List<DossierMedical> getDossiersByMedecin(@PathVariable Long idMedecin);

    @GetMapping("/api/dossiers-medicaux/diagnostic/{diagnostic}")
    List<DossierMedical> getDossiersByDiagnostic(@PathVariable Diagnostic diagnostic);

    @GetMapping("/api/dossiers-medicaux/medecin/{idMedecin}/diagnostic/{diagnostic}")
    List<DossierMedical> getDossiersByMedecinAndDiagnostic(
            @PathVariable Long idMedecin,
            @PathVariable Diagnostic diagnostic
    );


    // ========================
    // DATE FILTERS
    // ========================

    @GetMapping("/api/dossiers-medicaux/dates")
    List<DossierMedical> getDossiersByDateRange(
            @RequestParam LocalDate dateDebut,
            @RequestParam LocalDate dateFin
    );

    @GetMapping("/api/dossiers-medicaux/medecin/{idMedecin}/dates")
    List<DossierMedical> getDossiersByMedecinAndDateRange(
            @PathVariable Long idMedecin,
            @RequestParam LocalDate dateDebut,
            @RequestParam LocalDate dateFin
    );


    // ========================
    // UTILS
    // ========================

    @GetMapping("/api/dossiers-medicaux/medecin/{idMedecin}/count")
    Long countDossiersByMedecin(@PathVariable Long idMedecin);

    @GetMapping("/api/dossiers-medicaux/patient/{idPatient}/count")
    Long countDossiersByPatient(@PathVariable Long idPatient);

    @GetMapping("/api/dossiers-medicaux/{id}/exists")
    Boolean existsDossier(@PathVariable Long id);
}
