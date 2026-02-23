package com.example.NEPHRO.Controllers;

import com.example.NEPHRO.Enum.TypeImageMedicale;
import com.example.NEPHRO.Services.ImageMedicaleService;
import com.example.NEPHRO.dto.ImageMedicaleDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/images-medicales")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ImageMedicaleController {

    private final ImageMedicaleService imageMedicaleService;

    // Répertoire de stockage (doit correspondre au service)
    private static final String UPLOAD_DIR = System.getProperty("user.home") + File.separator + "nephro-uploads";

    // ========================================
    // CREATE WITH FILE UPLOAD
    // ========================================
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageMedicaleDTO> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("idSuivi") Long idSuivi,
            @RequestParam("typeImage") String typeImage,
            @RequestParam("dateCapture") String dateCapture,
            @RequestParam(value = "description", required = false) String description) {

        try {
            // Créer le DTO à partir des paramètres
            ImageMedicaleDTO imageDTO = new ImageMedicaleDTO();
            imageDTO.setIdSuivi(idSuivi);
            imageDTO.setTypeImage(TypeImageMedicale.valueOf(typeImage));
            imageDTO.setDateCapture(LocalDate.parse(dateCapture));
            imageDTO.setDescription(description);

            // Appeler le service pour sauvegarder l'image
            ImageMedicaleDTO createdImage = imageMedicaleService.uploadImage(imageDTO, file);

            return ResponseEntity.status(HttpStatus.CREATED).body(createdImage);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Type d'image invalide: " + typeImage);
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'upload de l'image: " + e.getMessage());
        }
    }

    // ========================================
    // SERVIR LES FICHIERS IMAGES (NOUVEAU!)
    // ========================================
    @GetMapping("/files/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            Path file = Paths.get(UPLOAD_DIR).resolve(filename);
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() || resource.isReadable()) {
                // Déterminer le type de contenu
                String contentType = "image/jpeg"; // Par défaut
                if (filename.endsWith(".png")) {
                    contentType = "image/png";
                } else if (filename.endsWith(".gif")) {
                    contentType = "image/gif";
                } else if (filename.endsWith(".bmp")) {
                    contentType = "image/bmp";
                } else if (filename.endsWith(".webp")) {
                    contentType = "image/webp";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (IOException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    // ========================================
    // AUTRES ENDPOINTS
    // ========================================

    // CREATE (JSON uniquement - pour compatibilité)
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ImageMedicaleDTO> createImage(@Valid @RequestBody ImageMedicaleDTO imageDTO) {
        ImageMedicaleDTO createdImage = imageMedicaleService.createImage(imageDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdImage);
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<ImageMedicaleDTO> updateImage(
            @PathVariable Long id,
            @Valid @RequestBody ImageMedicaleDTO imageDTO) {
        ImageMedicaleDTO updatedImage = imageMedicaleService.updateImage(id, imageDTO);
        return ResponseEntity.ok(updatedImage);
    }

    // GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<ImageMedicaleDTO> getImageById(@PathVariable Long id) {
        ImageMedicaleDTO image = imageMedicaleService.getImageById(id);
        return ResponseEntity.ok(image);
    }

    // GET ALL
    @GetMapping
    public ResponseEntity<List<ImageMedicaleDTO>> getAllImages() {
        List<ImageMedicaleDTO> images = imageMedicaleService.getAllImages();
        return ResponseEntity.ok(images);
    }

    // GET BY SUIVI
    @GetMapping("/suivi/{idSuivi}")
    public ResponseEntity<List<ImageMedicaleDTO>> getImagesBySuivi(@PathVariable Long idSuivi) {
        List<ImageMedicaleDTO> images = imageMedicaleService.getImagesBySuivi(idSuivi);
        return ResponseEntity.ok(images);
    }

    // GET BY TYPE
    @GetMapping("/type/{typeImage}")
    public ResponseEntity<List<ImageMedicaleDTO>> getImagesByType(@PathVariable TypeImageMedicale typeImage) {
        List<ImageMedicaleDTO> images = imageMedicaleService.getImagesByType(typeImage);
        return ResponseEntity.ok(images);
    }

    // GET BY DATE RANGE
    @GetMapping("/dates")
    public ResponseEntity<List<ImageMedicaleDTO>> getImagesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        List<ImageMedicaleDTO> images = imageMedicaleService.getImagesByDateRange(dateDebut, dateFin);
        return ResponseEntity.ok(images);
    }

    // GET BY SUIVI AND TYPE
    @GetMapping("/suivi/{idSuivi}/type/{typeImage}")
    public ResponseEntity<List<ImageMedicaleDTO>> getImagesBySuiviAndType(
            @PathVariable Long idSuivi,
            @PathVariable TypeImageMedicale typeImage) {
        List<ImageMedicaleDTO> images = imageMedicaleService.getImagesBySuiviAndType(idSuivi, typeImage);
        return ResponseEntity.ok(images);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteImage(@PathVariable Long id) {
        imageMedicaleService.deleteImage(id);
        return ResponseEntity.noContent().build();
    }

    // COUNT BY SUIVI
    @GetMapping("/suivi/{idSuivi}/count")
    public ResponseEntity<Long> countImagesBySuivi(@PathVariable Long idSuivi) {
        long count = imageMedicaleService.countImagesBySuivi(idSuivi);
        return ResponseEntity.ok(count);
    }

    // EXISTS BY SUIVI
    @GetMapping("/suivi/{idSuivi}/exists")
    public ResponseEntity<Boolean> existsImagesBySuivi(@PathVariable Long idSuivi) {
        boolean exists = imageMedicaleService.existsImagesBySuivi(idSuivi);
        return ResponseEntity.ok(exists);
    }
}