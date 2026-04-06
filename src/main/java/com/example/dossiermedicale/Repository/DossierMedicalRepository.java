package com.example.dossiermedicale.Repository;

import com.example.dossiermedicale.Entities.DossierMedical;
import com.example.dossiermedicale.Enum.Diagnostic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DossierMedicalRepository extends JpaRepository<DossierMedical, Long> {

    // Recherche par patient
    List<DossierMedical> findByIdPatient(Long idPatient);

    // Recherche par médecin
    List<DossierMedical> findByIdMedecin(Long idMedecin);
    List<DossierMedical> findByIdMedecinOrderByDateCreationDesc(Long idMedecin);

    // Recherche par diagnostic
    List<DossierMedical> findByDiagnostic(Diagnostic diagnostic);

    // Recherche combinée
    List<DossierMedical> findByIdMedecinAndDiagnostic(Long idMedecin, Diagnostic diagnostic);
    List<DossierMedical> findByIdPatientAndDiagnostic(Long idPatient, Diagnostic diagnostic);

    // Recherche par date
    List<DossierMedical> findByDateCreationBetween(LocalDate dateDebut, LocalDate dateFin);
    List<DossierMedical> findByIdMedecinAndDateCreationBetween(Long idMedecin, LocalDate dateDebut, LocalDate dateFin);
    List<DossierMedical> findByIdPatientAndDateCreationBetween(Long idPatient, LocalDate dateDebut, LocalDate dateFin);

    // Comptage
    long countByIdMedecin(Long idMedecin);
    long countByIdPatient(Long idPatient);
    long countByDiagnostic(Diagnostic diagnostic);
}