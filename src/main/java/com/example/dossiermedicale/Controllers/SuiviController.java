package com.example.dossiermedicale.Controllers;
import com.example.dossiermedicale.Services.OcrService;
import com.example.dossiermedicale.Services.SuiviService;
import com.example.dossiermedicale.dto.OcrResponse;
import com.example.dossiermedicale.dto.SuiviDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/suivis")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SuiviController {

    private static final String UPLOAD_SUIVIS_DIR = "uploads/suivis";

    private final SuiviService suiviService;
    private final OcrService ocrService;

    /** OCR : extrait le texte d'une image ou d'un PDF (scan de suivi). Retourne le texte et éventuellement un message d'erreur. */
    @PostMapping("/ocr")
    public ResponseEntity<OcrResponse> ocrSuivi(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(new OcrResponse("", "Aucun fichier envoyé."));
        }
        String name = file.getOriginalFilename();
        if (name == null) name = "";
        String lower = name.toLowerCase();
        boolean allowed = lower.endsWith(".pdf") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")
                || lower.endsWith(".png") || lower.endsWith(".gif") || lower.endsWith(".bmp") || lower.endsWith(".tiff") || lower.endsWith(".tif") || lower.endsWith(".webp");
        if (!allowed) {
            return ResponseEntity.badRequest().body(new OcrResponse("", "Format accepté : PDF ou image (jpg, png, gif, bmp, tiff, webp)."));
        }
        OcrResponse response = ocrService.extractText(file);
        return ResponseEntity.ok(response);
    }

    /** Upload d'une pièce jointe (PDF ou image) pour un suivi. Retourne le chemin à envoyer dans cheminPieceJointe. */
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadPieceJointe(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("path", ""));
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            return ResponseEntity.badRequest().body(Map.of("path", ""));
        }
        String lower = originalFilename.toLowerCase();
        boolean allowed = lower.endsWith(".pdf")
                || lower.endsWith(".jpg") || lower.endsWith(".jpeg")
                || lower.endsWith(".png") || lower.endsWith(".gif") || lower.endsWith(".webp");
        if (!allowed) {
            return ResponseEntity.badRequest().body(Map.of("path", "", "message", "Format accepté : PDF ou image (jpg, png, gif, webp)"));
        }
        try {
            Path dir = Paths.get(UPLOAD_SUIVIS_DIR).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            String suffix = originalFilename.substring(originalFilename.lastIndexOf('.'));
            String name = UUID.randomUUID().toString().replace("-", "") + suffix;
            Path target = dir.resolve(name);
            Files.copy(file.getInputStream(), target);
            String path = UPLOAD_SUIVIS_DIR + "/" + name;
            return ResponseEntity.ok(Map.of("path", path));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("path", ""));
        }
    }

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