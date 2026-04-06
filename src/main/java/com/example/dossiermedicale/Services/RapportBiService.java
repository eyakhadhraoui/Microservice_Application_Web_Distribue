package com.example.dossiermedicale.Services;

import com.example.dossiermedicale.Entities.DossierMedical;
import com.example.dossiermedicale.Entities.RapportBi;
import com.example.dossiermedicale.Entities.ResultatLaboratoire;
import com.example.dossiermedicale.Repository.DossierMedicalRepository;
import com.example.dossiermedicale.Repository.RapportBiRepository;
import com.example.dossiermedicale.Repository.ResultatLaboratoireRepository;
import com.example.dossiermedicale.dto.RapportBiDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service pour le rapport de bilan (RapportBi), lié au dossier et à une liste de ResultatLaboratoire.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class RapportBiService {

    private final RapportBiRepository rapportBiRepository;
    private final ResultatLaboratoireRepository resultatLaboratoireRepository;
    private final DossierMedicalRepository dossierMedicalRepository;
    private final BilanPdfService bilanPdfService;

    private RapportBiDTO toDTO(RapportBi entity) {
        RapportBiDTO dto = new RapportBiDTO();
        dto.setIdRapportBilan(entity.getIdRapportBilan());
        if (entity.getResultatLaboratoire() != null) {
            dto.setIdResultatLaboratoire(entity.getResultatLaboratoire().getIdResultatLaboratoire());
        }
        if (entity.getResultats() != null && !entity.getResultats().isEmpty()) {
            dto.setResultatsIds(entity.getResultats().stream()
                    .map(ResultatLaboratoire::getIdResultatLaboratoire)
                    .collect(Collectors.toList()));
        }
        dto.setIdDossierMedical(entity.getDossierMedical() != null ? entity.getDossierMedical().getIdDossierMedical() : null);
        dto.setDateRapport(entity.getDateRapport());
        dto.setContenu(entity.getContenu());
        dto.setConclusion(entity.getConclusion());
        dto.setRecommandations(entity.getRecommandations());
        dto.setCheminPdf(entity.getCheminPdf());
        dto.setSignatureBase64(entity.getSignatureBase64());
        dto.setDateSignature(entity.getDateSignature());
        dto.setNomMedecin(entity.getNomMedecin());
        dto.setPartagePatient(entity.getPartagePatient());
        return dto;
    }

    private RapportBi toEntity(RapportBiDTO dto) {
        RapportBi entity = new RapportBi();
        DossierMedical dossier = dossierMedicalRepository.findById(dto.getIdDossierMedical())
                .orElseThrow(() -> new RuntimeException("Dossier médical non trouvé: " + dto.getIdDossierMedical()));
        entity.setDossierMedical(dossier);
        if (dto.getIdResultatLaboratoire() != null) {
            ResultatLaboratoire resultat = resultatLaboratoireRepository.findById(dto.getIdResultatLaboratoire())
                    .orElseThrow(() -> new RuntimeException("Résultat laboratoire non trouvé: " + dto.getIdResultatLaboratoire()));
            entity.setResultatLaboratoire(resultat);
        }
        if (dto.getResultatsIds() != null && !dto.getResultatsIds().isEmpty()) {
            List<ResultatLaboratoire> resultats = new ArrayList<>();
            for (Long id : dto.getResultatsIds()) {
                resultatLaboratoireRepository.findById(id).ifPresent(resultats::add);
            }
            entity.setResultats(resultats);
        }
        entity.setDateRapport(dto.getDateRapport());
        entity.setContenu(dto.getContenu());
        entity.setConclusion(dto.getConclusion());
        entity.setRecommandations(dto.getRecommandations());
        entity.setPartagePatient(dto.getPartagePatient() != null ? dto.getPartagePatient() : false);
        if (dto.getSignatureBase64() != null && !dto.getSignatureBase64().isBlank()) {
            entity.setSignatureBase64(dto.getSignatureBase64());
            entity.setDateSignature(dto.getDateSignature() != null ? dto.getDateSignature() : LocalDateTime.now());
            entity.setNomMedecin(dto.getNomMedecin());
        }
        return entity;
    }

    public RapportBiDTO create(RapportBiDTO dto) {
        RapportBi saved = rapportBiRepository.save(toEntity(dto));
        String cheminPdf = bilanPdfService.generateAndSave(saved);
        if (cheminPdf != null) {
            saved.setCheminPdf(cheminPdf);
            saved = rapportBiRepository.save(saved);
        }
        return toDTO(saved);
    }

    public RapportBiDTO update(Long id, RapportBiDTO dto) {
        RapportBi entity = rapportBiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rapport bilan non trouvé avec l'ID: " + id));
        DossierMedical dossier = dossierMedicalRepository.findById(dto.getIdDossierMedical())
                .orElseThrow(() -> new RuntimeException("Dossier médical non trouvé: " + dto.getIdDossierMedical()));
        entity.setDossierMedical(dossier);
        if (dto.getIdResultatLaboratoire() != null) {
            ResultatLaboratoire resultat = resultatLaboratoireRepository.findById(dto.getIdResultatLaboratoire())
                    .orElseThrow(() -> new RuntimeException("Résultat laboratoire non trouvé: " + dto.getIdResultatLaboratoire()));
            entity.setResultatLaboratoire(resultat);
        } else {
            entity.setResultatLaboratoire(null);
        }
        if (dto.getResultatsIds() != null) {
            List<ResultatLaboratoire> resultats = dto.getResultatsIds().stream()
                    .flatMap(rid -> resultatLaboratoireRepository.findById(rid).stream())
                    .collect(Collectors.toList());
            entity.setResultats(resultats);
        }
        entity.setDateRapport(dto.getDateRapport());
        entity.setContenu(dto.getContenu());
        entity.setConclusion(dto.getConclusion());
        entity.setRecommandations(dto.getRecommandations());
        entity.setPartagePatient(dto.getPartagePatient() != null ? dto.getPartagePatient() : false);
        if (dto.getSignatureBase64() != null && !dto.getSignatureBase64().isBlank()) {
            entity.setSignatureBase64(dto.getSignatureBase64());
            entity.setDateSignature(dto.getDateSignature() != null ? dto.getDateSignature() : LocalDateTime.now());
            entity.setNomMedecin(dto.getNomMedecin());
        }
        RapportBi saved = rapportBiRepository.save(entity);
        String cheminPdf = bilanPdfService.generateAndSave(saved);
        if (cheminPdf != null) {
            saved.setCheminPdf(cheminPdf);
            saved = rapportBiRepository.save(saved);
        }
        return toDTO(saved);
    }

    @Transactional(readOnly = true)
    public RapportBiDTO getById(Long id) {
        RapportBi entity = rapportBiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rapport bilan non trouvé avec l'ID: " + id));
        return toDTO(entity);
    }

    @Transactional(readOnly = true)
    public List<RapportBiDTO> getAll() {
        return rapportBiRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RapportBiDTO> getByBilan(Long idResultatLaboratoire) {
        return rapportBiRepository.findByResultatLaboratoireIdResultatLaboratoireOrderByDateRapportDesc(idResultatLaboratoire)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RapportBiDTO> getByDossier(Long idDossierMedical) {
        return rapportBiRepository.findByDossierMedicalIdDossierMedicalOrderByDateRapportDesc(idDossierMedical)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RapportBiDTO> getByDateRange(LocalDate dateDebut, LocalDate dateFin) {
        return rapportBiRepository.findByDateRapportBetween(dateDebut, dateFin)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public void delete(Long id) {
        if (!rapportBiRepository.existsById(id)) {
            throw new RuntimeException("Rapport bilan non trouvé avec l'ID: " + id);
        }
        rapportBiRepository.deleteById(id);
    }
}
