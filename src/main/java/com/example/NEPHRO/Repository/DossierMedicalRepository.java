package com.example.NEPHRO.Repository;

import com.example.NEPHRO.Entities.DossierMedical;
import com.example.NEPHRO.Enum.Diagnostic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface DossierMedicalRepository extends JpaRepository<DossierMedical, Long> {

    List<DossierMedical> findByIdPatient(Long idPatient);
    List<DossierMedical> findByIdMedecinOrderByDateCreationDesc(Long idMedecin);
    List<DossierMedical> findByDiagnostic(Diagnostic diagnostic);
    List<DossierMedical> findByIdMedecinAndDiagnostic(Long idMedecin, Diagnostic diagnostic);
    List<DossierMedical> findByDateCreationBetween(LocalDate dateDebut, LocalDate dateFin);
    List<DossierMedical> findByIdMedecinAndDateCreationBetween(Long idMedecin, LocalDate dateDebut, LocalDate dateFin);
    long countByIdMedecin(Long idMedecin);
    long countByIdPatient(Long idPatient);
}