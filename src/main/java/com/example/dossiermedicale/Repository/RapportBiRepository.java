package com.example.dossiermedicale.Repository;

import com.example.dossiermedicale.Entities.RapportBi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RapportBiRepository extends JpaRepository<RapportBi, Long> {

    List<RapportBi> findByResultatLaboratoireIdResultatLaboratoireOrderByDateRapportDesc(Long idResultatLaboratoire);

    /** Rapports dont la liste resultats contient ce résultat. */
    List<RapportBi> findByResultatsIdResultatLaboratoireOrderByDateRapportDesc(Long idResultatLaboratoire);

    List<RapportBi> findByDossierMedicalIdDossierMedicalOrderByDateRapportDesc(Long idDossierMedical);

    List<RapportBi> findByDateRapportBetween(LocalDate dateDebut, LocalDate dateFin);

    List<RapportBi> findByResultatLaboratoireIdResultatLaboratoire(Long idResultatLaboratoire);

    long countByResultatLaboratoireIdResultatLaboratoire(Long idResultatLaboratoire);

    long countByDossierMedicalIdDossierMedical(Long idDossierMedical);
}
