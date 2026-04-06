package com.example.dossiermedicale.Controllers;

import com.example.dossiermedicale.Services.ResultatLaboratoireService;
import com.example.dossiermedicale.dto.ResultatLaboratoireDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/resultats-laboratoire")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ResultatLaboratoireController {

    private final ResultatLaboratoireService resultatLaboratoireService;

    @PostMapping
    public ResponseEntity<ResultatLaboratoireDTO> create(@Valid @RequestBody ResultatLaboratoireDTO dto) {
        ResultatLaboratoireDTO created = resultatLaboratoireService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResultatLaboratoireDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody ResultatLaboratoireDTO dto) {
        return ResponseEntity.ok(resultatLaboratoireService.update(id, dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResultatLaboratoireDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(resultatLaboratoireService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<ResultatLaboratoireDTO>> getAll() {
        return ResponseEntity.ok(resultatLaboratoireService.getAll());
    }

    @GetMapping("/dossier/{idDossierMedical}")
    public ResponseEntity<List<ResultatLaboratoireDTO>> getByDossier(@PathVariable Long idDossierMedical) {
        return ResponseEntity.ok(resultatLaboratoireService.getByDossier(idDossierMedical));
    }

    @GetMapping("/dates")
    public ResponseEntity<List<ResultatLaboratoireDTO>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        return ResponseEntity.ok(resultatLaboratoireService.getByDateRange(dateDebut, dateFin));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        resultatLaboratoireService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
