package com.example.dossiermedicale.Controllers;

import com.example.dossiermedicale.Services.RapportBilanService;
import com.example.dossiermedicale.dto.RapportBilanDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API rapport de bilan (module 4) : période, résultats inclus, partage famille.
 */
@RestController
@RequestMapping("/api/rapports-bilan")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RapportBilanController {

    private final RapportBilanService rapportBilanService;

    @PostMapping
    public ResponseEntity<RapportBilanDTO> create(@Valid @RequestBody RapportBilanDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(rapportBilanService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RapportBilanDTO> update(@PathVariable Long id, @Valid @RequestBody RapportBilanDTO dto) {
        return ResponseEntity.ok(rapportBilanService.update(id, dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RapportBilanDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(rapportBilanService.getById(id));
    }

    @GetMapping("/dossier/{dossierId}")
    public ResponseEntity<List<RapportBilanDTO>> getByDossier(@PathVariable Long dossierId) {
        return ResponseEntity.ok(rapportBilanService.getByDossier(dossierId));
    }

    /** Rapports partagés à la famille (vue patient). */
    @GetMapping("/dossier/{dossierId}/famille")
    public ResponseEntity<List<RapportBilanDTO>> getByDossierPartageFamille(@PathVariable Long dossierId) {
        return ResponseEntity.ok(rapportBilanService.getByDossierPartageFamille(dossierId));
    }
}
