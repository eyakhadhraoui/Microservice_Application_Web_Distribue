package com.example.dossiermedicale.Services;

import com.example.dossiermedicale.Entities.RapportBilan;
import com.example.dossiermedicale.Repository.RapportBilanRepository;
import com.example.dossiermedicale.dto.RapportBilanDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RapportBilanService {

    private final RapportBilanRepository rapportBilanRepository;

    private RapportBilanDTO toDTO(RapportBilan e) {
        RapportBilanDTO dto = new RapportBilanDTO();
        dto.setId(e.getId());
        dto.setDossierId(e.getDossierId());
        dto.setPeriodeDebut(e.getPeriodeDebut());
        dto.setPeriodeFin(e.getPeriodeFin());
        dto.setResultatsIds(e.getResultatsIds() != null ? List.copyOf(e.getResultatsIds()) : List.of());
        dto.setCommentaireMedecin(e.getCommentaireMedecin());
        dto.setPdfUrl(e.getPdfUrl());
        dto.setPartageFamille(e.getPartageFamille());
        dto.setDateGeneration(e.getDateGeneration());
        dto.setGenerePar(e.getGenerePar());
        return dto;
    }

    private RapportBilan toEntity(RapportBilanDTO dto) {
        return RapportBilan.builder()
                .dossierId(dto.getDossierId())
                .periodeDebut(dto.getPeriodeDebut())
                .periodeFin(dto.getPeriodeFin())
                .resultatsIds(dto.getResultatsIds() != null ? new java.util.ArrayList<>(dto.getResultatsIds()) : new java.util.ArrayList<>())
                .commentaireMedecin(dto.getCommentaireMedecin())
                .pdfUrl(dto.getPdfUrl())
                .partageFamille(dto.getPartageFamille() != null ? dto.getPartageFamille() : false)
                .dateGeneration(dto.getDateGeneration() != null ? dto.getDateGeneration() : LocalDateTime.now())
                .generePar(dto.getGenerePar())
                .build();
    }

    public RapportBilanDTO create(RapportBilanDTO dto) {
        if (dto.getDateGeneration() == null) dto.setDateGeneration(LocalDateTime.now());
        return toDTO(rapportBilanRepository.save(toEntity(dto)));
    }

    public RapportBilanDTO update(Long id, RapportBilanDTO dto) {
        RapportBilan e = rapportBilanRepository.findById(id).orElseThrow(() -> new RuntimeException("Rapport non trouvé: " + id));
        e.setCommentaireMedecin(dto.getCommentaireMedecin());
        e.setPartageFamille(dto.getPartageFamille() != null ? dto.getPartageFamille() : e.getPartageFamille());
        e.setResultatsIds(dto.getResultatsIds() != null ? new java.util.ArrayList<>(dto.getResultatsIds()) : e.getResultatsIds());
        if (dto.getPdfUrl() != null) e.setPdfUrl(dto.getPdfUrl());
        return toDTO(rapportBilanRepository.save(e));
    }

    @Transactional(readOnly = true)
    public RapportBilanDTO getById(Long id) {
        return toDTO(rapportBilanRepository.findById(id).orElseThrow(() -> new RuntimeException("Rapport non trouvé: " + id)));
    }

    @Transactional(readOnly = true)
    public List<RapportBilanDTO> getByDossier(Long dossierId) {
        return rapportBilanRepository.findByDossierIdOrderByDateGenerationDesc(dossierId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    /** Rapports partagés à la famille (vue patient). */
    @Transactional(readOnly = true)
    public List<RapportBilanDTO> getByDossierPartageFamille(Long dossierId) {
        return rapportBilanRepository.findByDossierIdAndPartageFamilleTrueOrderByDateGenerationDesc(dossierId).stream().map(this::toDTO).collect(Collectors.toList());
    }
}
