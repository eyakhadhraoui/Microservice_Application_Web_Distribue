package com.example.NEPHRO.Services;

import com.example.NEPHRO.Entities.DossierMedical;
import com.example.NEPHRO.Entities.Suivi;
import com.example.NEPHRO.Repository.DossierMedicalRepository;
import com.example.NEPHRO.Repository.SuiviRepository;
import com.example.NEPHRO.dto.SuiviDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SuiviService {

    private final SuiviRepository suiviRepository;
    private final DossierMedicalRepository dossierMedicalRepository;

    private SuiviDTO toDTO(Suivi suivi) {
        SuiviDTO dto = new SuiviDTO();
        dto.setIdSuivi(suivi.getIdSuivi());
        dto.setIdDossierMedical(suivi.getDossierMedical().getIdDossierMedical());
        dto.setDateSuivi(suivi.getDateSuivi());
        dto.setNotes(suivi.getNotes());
        dto.setObjectif(suivi.getObjectif());
        dto.setResultat(suivi.getResultat());
        return dto;
    }

    private Suivi toEntity(SuiviDTO dto) {
        Suivi suivi = new Suivi();

        DossierMedical dossier = dossierMedicalRepository.findById(dto.getIdDossierMedical())
                .orElseThrow(() -> new RuntimeException("Dossier médical non trouvé avec l'ID: " + dto.getIdDossierMedical()));

        suivi.setDossierMedical(dossier);
        suivi.setDateSuivi(dto.getDateSuivi());
        suivi.setNotes(dto.getNotes());
        suivi.setObjectif(dto.getObjectif());
        suivi.setResultat(dto.getResultat());

        return suivi;
    }

    public SuiviDTO createSuivi(SuiviDTO suiviDTO) {
        Suivi suivi = toEntity(suiviDTO);
        Suivi savedSuivi = suiviRepository.save(suivi);
        return toDTO(savedSuivi);
    }

    public SuiviDTO updateSuivi(Long id, SuiviDTO suiviDTO) {
        Suivi suivi = suiviRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Suivi non trouvé avec l'ID: " + id));

        if (!suivi.getDossierMedical().getIdDossierMedical().equals(suiviDTO.getIdDossierMedical())) {
            DossierMedical newDossier = dossierMedicalRepository.findById(suiviDTO.getIdDossierMedical())
                    .orElseThrow(() -> new RuntimeException("Dossier médical non trouvé avec l'ID: " + suiviDTO.getIdDossierMedical()));
            suivi.setDossierMedical(newDossier);
        }

        suivi.setDateSuivi(suiviDTO.getDateSuivi());
        suivi.setNotes(suiviDTO.getNotes());
        suivi.setObjectif(suiviDTO.getObjectif());
        suivi.setResultat(suiviDTO.getResultat());

        Suivi updatedSuivi = suiviRepository.save(suivi);
        return toDTO(updatedSuivi);
    }

    @Transactional(readOnly = true)
    public SuiviDTO getSuiviById(Long id) {
        Suivi suivi = suiviRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Suivi non trouvé avec l'ID: " + id));
        return toDTO(suivi);
    }

    @Transactional(readOnly = true)
    public List<SuiviDTO> getAllSuivis() {
        return suiviRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SuiviDTO> getSuivisByDossier(Long idDossierMedical) {
        return suiviRepository.findByDossierMedicalIdDossierMedicalOrderByDateSuiviDesc(idDossierMedical).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public void deleteSuivi(Long id) {
        if (!suiviRepository.existsById(id)) {
            throw new RuntimeException("Suivi non trouvé avec l'ID: " + id);
        }
        suiviRepository.deleteById(id);
    }
}