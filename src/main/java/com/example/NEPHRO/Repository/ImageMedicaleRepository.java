package com.example.NEPHRO.Repository;

import com.example.NEPHRO.Entities.ImageMedicale;
import com.example.NEPHRO.Enum.TypeImageMedicale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ImageMedicaleRepository extends JpaRepository<ImageMedicale, Long> {

    // ✅ CORRIGÉ: Utiliser la relation JPA "suivi.idSuivi"
    List<ImageMedicale> findBySuiviIdSuiviOrderByDateCaptureDesc(Long idSuivi);

    // Recherche par type d'image
    List<ImageMedicale> findByTypeImage(TypeImageMedicale typeImage);

    // Recherche par date de capture
    List<ImageMedicale> findByDateCapture(LocalDate dateCapture);
    List<ImageMedicale> findByDateCaptureBetween(LocalDate dateDebut, LocalDate dateFin);

    // Recherche combinée
    List<ImageMedicale> findBySuiviIdSuiviAndTypeImage(Long idSuivi, TypeImageMedicale typeImage);
    List<ImageMedicale> findBySuiviIdSuiviAndDateCaptureBetween(Long idSuivi, LocalDate dateDebut, LocalDate dateFin);

    // Comptage
    long countBySuiviIdSuivi(Long idSuivi);
    long countByTypeImage(TypeImageMedicale typeImage);

    // Vérifier l'existence
    boolean existsBySuiviIdSuivi(Long idSuivi);
}