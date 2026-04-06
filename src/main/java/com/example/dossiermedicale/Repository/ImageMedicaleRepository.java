package com.example.dossiermedicale.Repository;

import com.example.dossiermedicale.Entities.ImageMedicale;
import com.example.dossiermedicale.Enum.TypeImageMedicale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Repository
public interface ImageMedicaleRepository extends JpaRepository<ImageMedicale, Long> {

    List<ImageMedicale> findByDossierMedicalIdDossierMedicalOrderByDateCaptureDesc(Long idDossierMedical);
    /** Toutes les images des dossiers dont l'ID est dans la liste (pour calendrier patient). */
    List<ImageMedicale> findByDossierMedical_IdDossierMedicalIn(Set<Long> idDossiers);

    List<ImageMedicale> findByTypeImage(TypeImageMedicale typeImage);

    List<ImageMedicale> findByDateCapture(LocalDate dateCapture);
    List<ImageMedicale> findByDateCaptureBetween(LocalDate dateDebut, LocalDate dateFin);

    List<ImageMedicale> findByDossierMedicalIdDossierMedicalAndTypeImage(Long idDossierMedical, TypeImageMedicale typeImage);
    List<ImageMedicale> findByDossierMedicalIdDossierMedicalAndDateCaptureBetween(Long idDossierMedical, LocalDate dateDebut, LocalDate dateFin);

    long countByDossierMedicalIdDossierMedical(Long idDossierMedical);
    long countByTypeImage(TypeImageMedicale typeImage);

    boolean existsByDossierMedicalIdDossierMedical(Long idDossierMedical);
}
