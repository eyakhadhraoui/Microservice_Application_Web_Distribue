package com.example.dossiermedicale.Services;

import com.example.dossiermedicale.Entities.DossierMedical;
import com.example.dossiermedicale.Repository.DossierMedicalRepository;
import com.example.dossiermedicale.Repository.MedecinRepository;
import com.example.dossiermedicale.Repository.PatientRepository;
import com.example.dossiermedicale.dto.DossierMedicalDTO;
import com.example.dossiermedicale.Enum.Diagnostic;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DossierMedicalService {

    private final DossierMedicalRepository dossierMedicalRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;

    private DossierMedicalDTO toDTO(DossierMedical dossier) {
        DossierMedicalDTO dto = new DossierMedicalDTO();
        dto.setIdDossierMedical(dossier.getIdDossierMedical());
        dto.setIdPatient(dossier.getIdPatient());
        dto.setDateCreation(dossier.getDateCreation());
        dto.setIdMedecin(dossier.getIdMedecin());
        dto.setDiagnostic(dossier.getDiagnostic());
        dto.setNotes(dossier.getNotes());
        dto.setPoids(dossier.getPoids());
        dto.setTaille(dossier.getTaille());
        dto.setImc(dossier.getImc());
        return dto;
    }

    private void enrichWithNames(DossierMedicalDTO dto) {
        if (dto.getIdPatient() != null) {
            patientRepository.findById(dto.getIdPatient()).ifPresent(p ->
                    dto.setPatientNom((p.getFirstName() != null ? p.getFirstName() + " " : "") + (p.getLastName() != null ? p.getLastName() : "").trim())
            );
            if (dto.getPatientNom() == null) dto.setPatientNom("Patient #" + dto.getIdPatient());
        }
        if (dto.getIdMedecin() != null) {
            medecinRepository.findById(dto.getIdMedecin()).ifPresent(m ->
                    dto.setMedecinNom("Dr. " + (m.getNom() != null ? m.getNom() : "") + (m.getPrenom() != null && !m.getPrenom().isBlank() ? " " + m.getPrenom() : "").trim())
            );
            if (dto.getMedecinNom() == null) dto.setMedecinNom("Médecin #" + dto.getIdMedecin());
        }
    }

    // Convertir DTO -> Entity
    private DossierMedical toEntity(DossierMedicalDTO dto) {
        DossierMedical dossier = new DossierMedical();
        dossier.setIdDossierMedical(dto.getIdDossierMedical());
        dossier.setIdPatient(dto.getIdPatient());
        dossier.setDateCreation(dto.getDateCreation());
        dossier.setIdMedecin(dto.getIdMedecin());
        dossier.setDiagnostic(dto.getDiagnostic());
        dossier.setNotes(dto.getNotes());
        dossier.setPoids(dto.getPoids());
        dossier.setTaille(dto.getTaille());
        dossier.setImc(dto.getImc());
        return dossier;
    }

    // CREATE
    public DossierMedicalDTO createDossier(DossierMedicalDTO dossierDTO) {
        // Règle métier : un patient ne peut avoir qu'un seul dossier médical
        if (dossierDTO.getIdPatient() != null) {
            long existing = dossierMedicalRepository.countByIdPatient(dossierDTO.getIdPatient());
            if (existing > 0) {
                throw new IllegalArgumentException("Ce patient a déjà un dossier médical. Impossible d'en créer un deuxième.");
            }
        }

        DossierMedical dossier = toEntity(dossierDTO);
        DossierMedical savedDossier = dossierMedicalRepository.save(dossier);
        DossierMedicalDTO result = toDTO(savedDossier);
        enrichWithNames(result);
        return result;
    }

    // UPDATE
    public DossierMedicalDTO updateDossier(Long id, DossierMedicalDTO dossierDTO) {
        DossierMedical dossier = dossierMedicalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dossier médical non trouvé avec l'ID: " + id));

        dossier.setIdPatient(dossierDTO.getIdPatient());
        dossier.setDateCreation(dossierDTO.getDateCreation());
        dossier.setIdMedecin(dossierDTO.getIdMedecin());
        dossier.setDiagnostic(dossierDTO.getDiagnostic());
        dossier.setNotes(dossierDTO.getNotes());

        DossierMedical updatedDossier = dossierMedicalRepository.save(dossier);
        DossierMedicalDTO result = toDTO(updatedDossier);
        enrichWithNames(result);
        return result;
    }

    // GET BY ID
    @Transactional(readOnly = true)
    public DossierMedicalDTO getDossierById(Long id) {
        DossierMedical dossier = dossierMedicalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dossier médical non trouvé avec l'ID: " + id));
        DossierMedicalDTO dto = toDTO(dossier);
        enrichWithNames(dto);
        return dto;
    }

    // GET ALL
    @Transactional(readOnly = true)
    public List<DossierMedicalDTO> getAllDossiers() {
        return dossierMedicalRepository.findAll().stream()
                .map(this::toDTO)
                .peek(this::enrichWithNames)
                .collect(Collectors.toList());
    }

    // GET BY PATIENT
    @Transactional(readOnly = true)
    public List<DossierMedicalDTO> getDossiersByPatient(Long idPatient) {
        return dossierMedicalRepository.findByIdPatient(idPatient).stream()
                .map(this::toDTO)
                .peek(this::enrichWithNames)
                .collect(Collectors.toList());
    }

    // GET BY MEDECIN
    @Transactional(readOnly = true)
    public List<DossierMedicalDTO> getDossiersByMedecin(Long idMedecin) {
        return dossierMedicalRepository.findByIdMedecinOrderByDateCreationDesc(idMedecin).stream()
                .map(this::toDTO)
                .peek(this::enrichWithNames)
                .collect(Collectors.toList());
    }

    // GET BY DIAGNOSTIC
    @Transactional(readOnly = true)
    public List<DossierMedicalDTO> getDossiersByDiagnostic(Diagnostic diagnostic) {
        return dossierMedicalRepository.findByDiagnostic(diagnostic).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // GET BY MEDECIN AND DIAGNOSTIC
    @Transactional(readOnly = true)
    public List<DossierMedicalDTO> getDossiersByMedecinAndDiagnostic(Long idMedecin, Diagnostic diagnostic) {
        return dossierMedicalRepository.findByIdMedecinAndDiagnostic(idMedecin, diagnostic).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // GET BY DATE RANGE
    @Transactional(readOnly = true)
    public List<DossierMedicalDTO> getDossiersByDateRange(LocalDate dateDebut, LocalDate dateFin) {
        return dossierMedicalRepository.findByDateCreationBetween(dateDebut, dateFin).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // GET BY MEDECIN AND DATE RANGE
    @Transactional(readOnly = true)
    public List<DossierMedicalDTO> getDossiersByMedecinAndDateRange(Long idMedecin, LocalDate dateDebut, LocalDate dateFin) {
        return dossierMedicalRepository.findByIdMedecinAndDateCreationBetween(idMedecin, dateDebut, dateFin).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // DELETE
    public void deleteDossier(Long id) {
        if (!dossierMedicalRepository.existsById(id)) {
            throw new RuntimeException("Dossier médical non trouvé avec l'ID: " + id);
        }
        dossierMedicalRepository.deleteById(id);
    }

    // COUNT BY MEDECIN
    @Transactional(readOnly = true)
    public long countDossiersByMedecin(Long idMedecin) {
        return dossierMedicalRepository.countByIdMedecin(idMedecin);
    }

    // COUNT BY PATIENT
    @Transactional(readOnly = true)
    public long countDossiersByPatient(Long idPatient) {
        return dossierMedicalRepository.countByIdPatient(idPatient);
    }

    // EXISTS BY ID
    @Transactional(readOnly = true)
    public boolean existsDossier(Long id) {
        return dossierMedicalRepository.existsById(id);
    }
}
