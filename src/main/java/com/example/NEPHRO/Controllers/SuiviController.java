package com.example.NEPHRO.Controllers;
import com.example.NEPHRO.Services.SuiviService;
import com.example.NEPHRO.dto.SuiviDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/suivis")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SuiviController {

    private final SuiviService suiviService;

    @PostMapping
    public ResponseEntity<SuiviDTO> createSuivi(@Valid @RequestBody SuiviDTO suiviDTO) {
        SuiviDTO createdSuivi = suiviService.createSuivi(suiviDTO);
        return new ResponseEntity<>(createdSuivi, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SuiviDTO> updateSuivi(
            @PathVariable Long id,
            @Valid @RequestBody SuiviDTO suiviDTO) {
        SuiviDTO updatedSuivi = suiviService.updateSuivi(id, suiviDTO);
        return ResponseEntity.ok(updatedSuivi);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SuiviDTO> getSuiviById(@PathVariable Long id) {
        SuiviDTO suivi = suiviService.getSuiviById(id);
        return ResponseEntity.ok(suivi);
    }

    @GetMapping
    public ResponseEntity<List<SuiviDTO>> getAllSuivis() {
        List<SuiviDTO> suivis = suiviService.getAllSuivis();
        return ResponseEntity.ok(suivis);
    }

    @GetMapping("/dossier/{idDossierMedical}")
    public ResponseEntity<List<SuiviDTO>> getSuivisByDossier(@PathVariable Long idDossierMedical) {
        List<SuiviDTO> suivis = suiviService.getSuivisByDossier(idDossierMedical);
        return ResponseEntity.ok(suivis);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSuivi(@PathVariable Long id) {
        suiviService.deleteSuivi(id);
        return ResponseEntity.noContent().build();
    }
}