package com.example.dossiermedicale.Controllers;

import com.example.dossiermedicale.Services.RapportBiService;
import com.example.dossiermedicale.dto.RapportBiDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;

/**
 * API pour le rapport de bilan (RapportBi), lié au résultat laboratoire (bilan) et au dossier médical.
 */
@RestController
@RequestMapping("/api/rapports-bi")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RapportBiController {

    private final RapportBiService rapportBiService;

    @PostMapping
    public ResponseEntity<RapportBiDTO> create(@Valid @RequestBody RapportBiDTO dto) {
        RapportBiDTO created = rapportBiService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RapportBiDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody RapportBiDTO dto) {
        return ResponseEntity.ok(rapportBiService.update(id, dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RapportBiDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(rapportBiService.getById(id));
    }

    /** Télécharge ou ouvre le PDF du rapport de bilan (enregistré à la création/mise à jour). */
    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<Resource> getPdf(@PathVariable Long id) {
        RapportBiDTO dto = rapportBiService.getById(id);
        if (dto.getCheminPdf() == null || dto.getCheminPdf().isBlank()) {
            return ResponseEntity.notFound().build();
        }
        try {
            Path path = Paths.get(dto.getCheminPdf()).toAbsolutePath().normalize();
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }
            String filename = "bilan-rapport-" + id + ".pdf";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<RapportBiDTO>> getAll() {
        return ResponseEntity.ok(rapportBiService.getAll());
    }

    /** Rapports de bilan pour un résultat laboratoire (bilan) donné. */
    @GetMapping("/bilan/{idResultatLaboratoire}")
    public ResponseEntity<List<RapportBiDTO>> getByBilan(@PathVariable Long idResultatLaboratoire) {
        return ResponseEntity.ok(rapportBiService.getByBilan(idResultatLaboratoire));
    }

    @GetMapping("/dossier/{idDossierMedical}")
    public ResponseEntity<List<RapportBiDTO>> getByDossier(@PathVariable Long idDossierMedical) {
        return ResponseEntity.ok(rapportBiService.getByDossier(idDossierMedical));
    }

    @GetMapping("/dates")
    public ResponseEntity<List<RapportBiDTO>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        return ResponseEntity.ok(rapportBiService.getByDateRange(dateDebut, dateFin));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        rapportBiService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
