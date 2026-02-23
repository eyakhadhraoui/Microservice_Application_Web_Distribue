package com.example.NEPHRO.Repository;

import com.example.NEPHRO.Entities.Suivi;
import com.example.NEPHRO.Enum.StatutSuivi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SuiviRepository extends JpaRepository<Suivi, Long> {

    // Recherche par dossier médical
    List<Suivi> findByDossierMedicalIdDossierMedical(Long idDossierMedical);
    List<Suivi> findByDossierMedicalIdDossierMedicalOrderByDateSuiviDesc(Long idDossierMedical);

    // Recherche par statut/résultat
    List<Suivi> findByResultat(StatutSuivi resultat);

    // Recherche par date
    List<Suivi> findByDateSuiviBetween(LocalDate dateDebut, LocalDate dateFin);
    List<Suivi> findByDossierMedicalIdDossierMedicalAndDateSuiviBetween(Long idDossierMedical, LocalDate dateDebut, LocalDate dateFin);

    // Recherche combinée
    List<Suivi> findByDossierMedicalIdDossierMedicalAndResultat(Long idDossierMedical, StatutSuivi resultat);

    // Comptage
    long countByDossierMedicalIdDossierMedical(Long idDossierMedical);
    long countByResultat(StatutSuivi resultat);
}
