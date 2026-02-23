package com.example.NEPHRO.Services;

import com.example.NEPHRO.Entities.ImageMedicale;
import com.example.NEPHRO.Entities.Suivi;
import com.example.NEPHRO.Enum.TypeImageMedicale;
import com.example.NEPHRO.Repository.ImageMedicaleRepository;
import com.example.NEPHRO.Repository.SuiviRepository;
import com.example.NEPHRO.dto.ImageMedicaleDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ImageMedicaleService {

    private final ImageMedicaleRepository imageMedicaleRepository;
    private final SuiviRepository suiviRepository;

    // Répertoire de stockage des images (configurable dans application.properties)
    @Value("${app.upload.dir:${user.home}/nephro-uploads}")
    private String uploadDir;

    // ========================================
    // MÉTHODE D'UPLOAD DE FICHIER (NOUVELLE)
    // ========================================

    /**
     * Upload d'une image avec fichier
     */
    public ImageMedicaleDTO uploadImage(ImageMedicaleDTO imageDTO, MultipartFile file) {
        try {
            // Vérifier que le suivi existe
            Suivi suivi = suiviRepository.findById(imageDTO.getIdSuivi())
                    .orElseThrow(() -> new RuntimeException("Suivi non trouvé avec l'ID: " + imageDTO.getIdSuivi()));

            // Créer le répertoire de stockage s'il n'existe pas
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Générer un nom de fichier unique
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : "";
            String uniqueFilename = UUID.randomUUID().toString() + extension;

            // Sauvegarder le fichier
            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Créer l'entité ImageMedicale
            ImageMedicale imageMedicale = new ImageMedicale();
            imageMedicale.setSuivi(suivi);
            imageMedicale.setTypeImage(imageDTO.getTypeImage());
            imageMedicale.setCheminImage(filePath.toString());
            imageMedicale.setDateCapture(imageDTO.getDateCapture());
            imageMedicale.setDescription(imageDTO.getDescription());

            // Sauvegarder en base de données
            ImageMedicale savedImage = imageMedicaleRepository.save(imageMedicale);

            return toDTO(savedImage);

        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de la sauvegarde du fichier: " + e.getMessage(), e);
        }
    }

    // ========================================
    // MÉTHODES DE CONVERSION
    // ========================================
    public Resource loadFileAsResource(String filename) throws Exception {
        Path filePath = Paths.get("uploads").resolve(filename).normalize();
        Resource resource = new UrlResource(filePath.toUri());

        if(resource.exists()) {
            return resource;
        } else {
            throw new Exception("Fichier non trouvé : " + filename);
        }
    }
    // Convertir Entity -> DTO
    private ImageMedicaleDTO toDTO(ImageMedicale image) {
        ImageMedicaleDTO dto = new ImageMedicaleDTO();
        dto.setIdImage(image.getIdImage());
        dto.setIdSuivi(image.getSuivi().getIdSuivi());
        dto.setTypeImage(image.getTypeImage());
        dto.setCheminImage(image.getCheminImage());
        dto.setDateCapture(image.getDateCapture());
        dto.setDescription(image.getDescription());
        return dto;
    }

    // Convertir DTO -> Entity
    private ImageMedicale toEntity(ImageMedicaleDTO dto) {
        ImageMedicale image = new ImageMedicale();

        Suivi suivi = suiviRepository.findById(dto.getIdSuivi())
                .orElseThrow(() -> new RuntimeException("Suivi non trouvé avec l'ID: " + dto.getIdSuivi()));

        image.setSuivi(suivi);
        image.setTypeImage(dto.getTypeImage());
        image.setCheminImage(dto.getCheminImage());
        image.setDateCapture(dto.getDateCapture());
        image.setDescription(dto.getDescription());

        return image;
    }

    // ========================================
    // MÉTHODES CRUD EXISTANTES
    // ========================================

    // CREATE
    public ImageMedicaleDTO createImage(ImageMedicaleDTO imageDTO) {
        ImageMedicale image = toEntity(imageDTO);
        ImageMedicale savedImage = imageMedicaleRepository.save(image);
        return toDTO(savedImage);
    }

    // UPDATE
    public ImageMedicaleDTO updateImage(Long id, ImageMedicaleDTO imageDTO) {
        ImageMedicale image = imageMedicaleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Image médicale non trouvée avec l'ID: " + id));

        // Mettre à jour la relation Suivi si nécessaire
        if (!image.getSuivi().getIdSuivi().equals(imageDTO.getIdSuivi())) {
            Suivi newSuivi = suiviRepository.findById(imageDTO.getIdSuivi())
                    .orElseThrow(() -> new RuntimeException("Suivi non trouvé avec l'ID: " + imageDTO.getIdSuivi()));
            image.setSuivi(newSuivi);
        }

        image.setTypeImage(imageDTO.getTypeImage());
        image.setCheminImage(imageDTO.getCheminImage());
        image.setDateCapture(imageDTO.getDateCapture());
        image.setDescription(imageDTO.getDescription());

        ImageMedicale updatedImage = imageMedicaleRepository.save(image);
        return toDTO(updatedImage);
    }

    // GET BY ID
    @Transactional(readOnly = true)
    public ImageMedicaleDTO getImageById(Long id) {
        ImageMedicale image = imageMedicaleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Image médicale non trouvée avec l'ID: " + id));
        return toDTO(image);
    }

    // GET ALL
    @Transactional(readOnly = true)
    public List<ImageMedicaleDTO> getAllImages() {
        return imageMedicaleRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // GET BY SUIVI
    @Transactional(readOnly = true)
    public List<ImageMedicaleDTO> getImagesBySuivi(Long idSuivi) {
        return imageMedicaleRepository.findBySuiviIdSuiviOrderByDateCaptureDesc(idSuivi).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // GET BY TYPE
    @Transactional(readOnly = true)
    public List<ImageMedicaleDTO> getImagesByType(TypeImageMedicale typeImage) {
        return imageMedicaleRepository.findByTypeImage(typeImage).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // GET BY DATE RANGE
    @Transactional(readOnly = true)
    public List<ImageMedicaleDTO> getImagesByDateRange(LocalDate dateDebut, LocalDate dateFin) {
        return imageMedicaleRepository.findByDateCaptureBetween(dateDebut, dateFin).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // GET BY SUIVI AND TYPE
    @Transactional(readOnly = true)
    public List<ImageMedicaleDTO> getImagesBySuiviAndType(Long idSuivi, TypeImageMedicale typeImage) {
        return imageMedicaleRepository.findBySuiviIdSuiviAndTypeImage(idSuivi, typeImage).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // DELETE
    public void deleteImage(Long id) {
        ImageMedicale image = imageMedicaleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Image médicale non trouvée avec l'ID: " + id));

        // Supprimer le fichier physique s'il existe
        if (image.getCheminImage() != null) {
            try {
                Path filePath = Paths.get(image.getCheminImage());
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                // Log l'erreur mais continue la suppression en base
                System.err.println("Erreur lors de la suppression du fichier: " + e.getMessage());
            }
        }

        imageMedicaleRepository.deleteById(id);
    }

    // COUNT BY SUIVI
    @Transactional(readOnly = true)
    public long countImagesBySuivi(Long idSuivi) {
        return imageMedicaleRepository.countBySuiviIdSuivi(idSuivi);
    }

    // EXISTS BY SUIVI
    @Transactional(readOnly = true)
    public boolean existsImagesBySuivi(Long idSuivi) {
        return imageMedicaleRepository.existsBySuiviIdSuivi(idSuivi);
    }
}