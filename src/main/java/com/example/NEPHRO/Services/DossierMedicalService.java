package com.example.NEPHRO.Services;

import com.example.NEPHRO.Entities.DossierMedical;
import com.example.NEPHRO.Enum.Diagnostic;
import com.example.NEPHRO.Repository.DossierMedicalRepository;
import com.example.NEPHRO.dto.DossierMedicalDTO;
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

    // Entity -> DTO
    private DossierMedicalDTO toDTO(DossierMedical dossier) {
        DossierMedicalDTO dto = new DossierMedicalDTO();
        dto.setIdDossierMedical(dossier.getIdDossierMedical());
        dto.setDateCreation(dossier.getDateCreation());
        dto.setDiagnostic(dossier.getDiagnostic());
        dto.setNotes(dossier.getNotes());
        dto.setIdPatient(dossier.getIdPatient());
        dto.setIdMedecin(dossier.getIdMedecin());
        return dto;
    }

    // DTO -> Entity
    private DossierMedical toEntity(DossierMedicalDTO dto) {
        DossierMedical dossier = new DossierMedical();
        dossier.setIdDossierMedical(dto.getIdDossierMedical());
        dossier.setDateCreation(dto.getDateCreation());
        dossier.setDiagnostic(dto.getDiagnostic());
        dossier.setNotes(dto.getNotes());
        dossier.setIdPatient(dto.getIdPatient());
        dossier.setIdMedecin(dto.getIdMedecin());
        return dossier;
    }

    // CREATE
    public DossierMedicalDTO createDossier(DossierMedicalDTO dossierDTO) {
        DossierMedical dossier = toEntity(dossierDTO);
        return toDTO(dossierMedicalRepository.save(dossier));
    }

    // UPDATE
    public DossierMedicalDTO updateDossier(Long id, DossierMedicalDTO dossierDTO) {
        DossierMedical dossier = dossierMedicalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dossier non trouvé: " + id));

        dossier.setDateCreation(dossierDTO.getDateCreation());
        dossier.setDiagnostic(dossierDTO.getDiagnostic());
        dossier.setNotes(dossierDTO.getNotes());
        dossier.setIdPatient(dossierDTO.getIdPatient());
        dossier.setIdMedecin(dossierDTO.getIdMedecin());

        return toDTO(dossierMedicalRepository.save(dossier));
    }

    // GET BY ID
    @Transactional(readOnly = true)
    public DossierMedicalDTO getDossierById(Long id) {
        return toDTO(dossierMedicalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dossier non trouvé: " + id)));
    }

    // GET ALL
    @Transactional(readOnly = true)
    public List<DossierMedicalDTO> getAllDossiers() {
        return dossierMedicalRepository.findAll().stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    // GET BY PATIENT
    @Transactional(readOnly = true)
    public List<DossierMedicalDTO> getDossiersByPatient(Long idPatient) {
        return dossierMedicalRepository.findByIdPatient(idPatient).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    // GET BY MEDECIN
    @Transactional(readOnly = true)
    public List<DossierMedicalDTO> getDossiersByMedecin(Long idMedecin) {
        return dossierMedicalRepository.findByIdMedecinOrderByDateCreationDesc(idMedecin).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    // GET BY DIAGNOSTIC
    @Transactional(readOnly = true)
    public List<DossierMedicalDTO> getDossiersByDiagnostic(Diagnostic diagnostic) {
        return dossierMedicalRepository.findByDiagnostic(diagnostic).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    // GET BY MEDECIN AND DIAGNOSTIC
    @Transactional(readOnly = true)
    public List<DossierMedicalDTO> getDossiersByMedecinAndDiagnostic(Long idMedecin, Diagnostic diagnostic) {
        return dossierMedicalRepository.findByIdMedecinAndDiagnostic(idMedecin, diagnostic).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    // GET BY DATE RANGE
    @Transactional(readOnly = true)
    public List<DossierMedicalDTO> getDossiersByDateRange(LocalDate dateDebut, LocalDate dateFin) {
        return dossierMedicalRepository.findByDateCreationBetween(dateDebut, dateFin).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    // GET BY MEDECIN AND DATE RANGE
    @Transactional(readOnly = true)
    public List<DossierMedicalDTO> getDossiersByMedecinAndDateRange(Long idMedecin, LocalDate dateDebut, LocalDate dateFin) {
        return dossierMedicalRepository.findByIdMedecinAndDateCreationBetween(idMedecin, dateDebut, dateFin).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    // DELETE
    public void deleteDossier(Long id) {
        if (!dossierMedicalRepository.existsById(id))
            throw new RuntimeException("Dossier non trouvé: " + id);
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

    // EXISTS
    @Transactional(readOnly = true)
    public boolean existsDossier(Long id) {
        return dossierMedicalRepository.existsById(id);
    }
}