package com.example.dossiermedicale.Repository;

import com.example.dossiermedicale.Entities.ResultatLaboratoire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ResultatLaboratoireRepository extends JpaRepository<ResultatLaboratoire, Long> {

    List<ResultatLaboratoire> findByDossierMedicalIdDossierMedicalOrderByDateResultatDesc(Long idDossierMedical);

    List<ResultatLaboratoire> findByTestLaboratoireIdTestLaboratoireOrderByDateResultatDesc(Long idTestLaboratoire);

    List<ResultatLaboratoire> findByDateResultatBetween(LocalDate dateDebut, LocalDate dateFin);

    List<ResultatLaboratoire> findByDossierMedicalIdDossierMedicalAndDateResultatBetween(
            Long idDossierMedical, LocalDate dateDebut, LocalDate dateFin);

    long countByDossierMedicalIdDossierMedical(Long idDossierMedical);
}
