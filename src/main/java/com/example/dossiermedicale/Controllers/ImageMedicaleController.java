package com.example.dossiermedicale.Controllers;

import com.example.dossiermedicale.Services.ImageMedicaleService;
import com.example.dossiermedicale.dto.ImageMedicaleDTO;
import com.example.dossiermedicale.Enum.TypeImageMedicale;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/images-medicales")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ImageMedicaleController {

    private final ImageMedicaleService imageMedicaleService;

    private static final String UPLOAD_DIR = "uploads";

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("path", ""));
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.matches("(?i).+\\.(jpe?g|png|gif|webp|bmp)")) {
            return ResponseEntity.badRequest().body(Map.of("path", ""));
        }
        try {
            Path dir = Paths.get(UPLOAD_DIR).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            String suffix = originalFilename.substring(originalFilename.lastIndexOf('.'));
            String name = UUID.randomUUID().toString().replace("-", "") + suffix;
            Path target = dir.resolve(name);
            Files.copy(file.getInputStream(), target);
            String path = UPLOAD_DIR + "/" + name;
            return ResponseEntity.ok(Map.of("path", path));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("path", ""));
        }
    }

    @PostMapping
    public ResponseEntity<ImageMedicaleDTO> createImage(@Valid @RequestBody ImageMedicaleDTO imageDTO) {
        ImageMedicaleDTO createdImage = imageMedicaleService.createImage(imageDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdImage);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ImageMedicaleDTO> updateImage(
            @PathVariable Long id,
            @Valid @RequestBody ImageMedicaleDTO imageDTO) {
        ImageMedicaleDTO updatedImage = imageMedicaleService.updateImage(id, imageDTO);
        return ResponseEntity.ok(updatedImage);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ImageMedicaleDTO> getImageById(@PathVariable Long id) {
        ImageMedicaleDTO image = imageMedicaleService.getImageById(id);
        return ResponseEntity.ok(image);
    }

    @GetMapping
    public ResponseEntity<List<ImageMedicaleDTO>> getAllImages() {
        List<ImageMedicaleDTO> images = imageMedicaleService.getAllImages();
        return ResponseEntity.ok(images);
    }

    @GetMapping("/dossier/{idDossierMedical}")
    public ResponseEntity<List<ImageMedicaleDTO>> getImagesByDossier(@PathVariable Long idDossierMedical) {
        List<ImageMedicaleDTO> images = imageMedicaleService.getImagesByDossier(idDossierMedical);
        return ResponseEntity.ok(images);
    }

    @GetMapping("/type/{typeImage}")
    public ResponseEntity<List<ImageMedicaleDTO>> getImagesByType(@PathVariable TypeImageMedicale typeImage) {
        List<ImageMedicaleDTO> images = imageMedicaleService.getImagesByType(typeImage);
        return ResponseEntity.ok(images);
    }

    @GetMapping("/dates")
    public ResponseEntity<List<ImageMedicaleDTO>> getImagesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        List<ImageMedicaleDTO> images = imageMedicaleService.getImagesByDateRange(dateDebut, dateFin);
        return ResponseEntity.ok(images);
    }

    @GetMapping("/dossier/{idDossierMedical}/type/{typeImage}")
    public ResponseEntity<List<ImageMedicaleDTO>> getImagesByDossierAndType(
            @PathVariable Long idDossierMedical,
            @PathVariable TypeImageMedicale typeImage) {
        List<ImageMedicaleDTO> images = imageMedicaleService.getImagesByDossierAndType(idDossierMedical, typeImage);
        return ResponseEntity.ok(images);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteImage(@PathVariable Long id) {
        imageMedicaleService.deleteImage(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/dossier/{idDossierMedical}/count")
    public ResponseEntity<Long> countImagesByDossier(@PathVariable Long idDossierMedical) {
        long count = imageMedicaleService.countImagesByDossier(idDossierMedical);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/dossier/{idDossierMedical}/exists")
    public ResponseEntity<Boolean> existsImagesByDossier(@PathVariable Long idDossierMedical) {
        boolean exists = imageMedicaleService.existsImagesByDossier(idDossierMedical);
        return ResponseEntity.ok(exists);
    }
}
