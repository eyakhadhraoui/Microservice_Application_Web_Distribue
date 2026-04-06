package com.example.dossiermedicale.Services;

import com.example.dossiermedicale.Entities.DossierMedical;
import com.example.dossiermedicale.Entities.ImageMedicale;
import com.example.dossiermedicale.Repository.DossierMedicalRepository;
import com.example.dossiermedicale.Repository.ImageMedicaleRepository;
import com.example.dossiermedicale.dto.ImageMedicaleDTO;
import com.example.dossiermedicale.Enum.TypeImageMedicale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ImageMedicaleService {

    private final ImageMedicaleRepository imageMedicaleRepository;
    private final DossierMedicalRepository dossierMedicalRepository;
    private final NotificationWebSocketService notificationWebSocketService;

    private ImageMedicaleDTO toDTO(ImageMedicale image) {
        ImageMedicaleDTO dto = new ImageMedicaleDTO();
        dto.setIdImage(image.getIdImage());
        dto.setIdDossierMedical(image.getDossierMedical().getIdDossierMedical());
        dto.setTypeImage(image.getTypeImage());
        dto.setCheminImage(image.getCheminImage());
        dto.setDateCapture(image.getDateCapture());
        dto.setDescription(image.getDescription());
        return dto;
    }

    private ImageMedicale toEntity(ImageMedicaleDTO dto) {
        ImageMedicale image = new ImageMedicale();
        DossierMedical dossier = dossierMedicalRepository.findById(dto.getIdDossierMedical())
                .orElseThrow(() -> new RuntimeException("Dossier médical non trouvé avec l'ID: " + dto.getIdDossierMedical()));
        image.setDossierMedical(dossier);
        image.setTypeImage(dto.getTypeImage());
        image.setCheminImage(dto.getCheminImage());
        image.setDateCapture(dto.getDateCapture());
        image.setDescription(dto.getDescription());
        return image;
    }

    public ImageMedicaleDTO createImage(ImageMedicaleDTO imageDTO) {
        ImageMedicale image = toEntity(imageDTO);
        ImageMedicale savedImage = imageMedicaleRepository.save(image);
        // Construire le DTO sans accéder à la relation (évite NPE / lazy après save)
        ImageMedicaleDTO result = new ImageMedicaleDTO();
        result.setIdImage(savedImage.getIdImage());
        result.setIdDossierMedical(imageDTO.getIdDossierMedical());
        result.setTypeImage(savedImage.getTypeImage());
        result.setCheminImage(savedImage.getCheminImage());
        result.setDateCapture(savedImage.getDateCapture());
        result.setDescription(savedImage.getDescription() != null ? savedImage.getDescription() : imageDTO.getDescription());
        // Notification temps réel au patient
        try {
            if (savedImage.getDossierMedical() != null && savedImage.getDossierMedical().getIdPatient() != null) {
                String typeLibelle = savedImage.getTypeImage() != null ? savedImage.getTypeImage().getLibelle() : null;
                notificationWebSocketService.notifyPatientNewImage(
                        savedImage.getDossierMedical().getIdPatient(),
                        typeLibelle,
                        savedImage.getDateCapture(),
                        savedImage.getDossierMedical().getIdDossierMedical(),
                        savedImage.getIdImage()
                );
            }
        } catch (Exception e) {
            log.warn("Échec notification WebSocket (nouvelle image) au patient {}: {}",
                    savedImage.getDossierMedical().getIdPatient(), e.getMessage());
        }
        return result;
    }

    public ImageMedicaleDTO updateImage(Long id, ImageMedicaleDTO imageDTO) {
        ImageMedicale image = imageMedicaleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Image médicale non trouvée avec l'ID: " + id));

        if (!image.getDossierMedical().getIdDossierMedical().equals(imageDTO.getIdDossierMedical())) {
            DossierMedical newDossier = dossierMedicalRepository.findById(imageDTO.getIdDossierMedical())
                    .orElseThrow(() -> new RuntimeException("Dossier médical non trouvé avec l'ID: " + imageDTO.getIdDossierMedical()));
            image.setDossierMedical(newDossier);
        }

        image.setTypeImage(imageDTO.getTypeImage());
        image.setCheminImage(imageDTO.getCheminImage());
        image.setDateCapture(imageDTO.getDateCapture());
        image.setDescription(imageDTO.getDescription());

        ImageMedicale updatedImage = imageMedicaleRepository.save(image);
        return toDTO(updatedImage);
    }

    @Transactional(readOnly = true)
    public ImageMedicaleDTO getImageById(Long id) {
        ImageMedicale image = imageMedicaleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Image médicale non trouvée avec l'ID: " + id));
        return toDTO(image);
    }

    @Transactional(readOnly = true)
    public List<ImageMedicaleDTO> getAllImages() {
        return imageMedicaleRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ImageMedicaleDTO> getImagesByDossier(Long idDossierMedical) {
        return imageMedicaleRepository.findByDossierMedicalIdDossierMedicalOrderByDateCaptureDesc(idDossierMedical).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ImageMedicaleDTO> getImagesByType(TypeImageMedicale typeImage) {
        return imageMedicaleRepository.findByTypeImage(typeImage).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ImageMedicaleDTO> getImagesByDateRange(LocalDate dateDebut, LocalDate dateFin) {
        return imageMedicaleRepository.findByDateCaptureBetween(dateDebut, dateFin).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ImageMedicaleDTO> getImagesByDossierAndType(Long idDossierMedical, TypeImageMedicale typeImage) {
        return imageMedicaleRepository.findByDossierMedicalIdDossierMedicalAndTypeImage(idDossierMedical, typeImage).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public void deleteImage(Long id) {
        if (!imageMedicaleRepository.existsById(id)) {
            throw new RuntimeException("Image médicale non trouvée avec l'ID: " + id);
        }
        imageMedicaleRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public long countImagesByDossier(Long idDossierMedical) {
        return imageMedicaleRepository.countByDossierMedicalIdDossierMedical(idDossierMedical);
    }

    @Transactional(readOnly = true)
    public boolean existsImagesByDossier(Long idDossierMedical) {
        return imageMedicaleRepository.existsByDossierMedicalIdDossierMedical(idDossierMedical);
    }
}
