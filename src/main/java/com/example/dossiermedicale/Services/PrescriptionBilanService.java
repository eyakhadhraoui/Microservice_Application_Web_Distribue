package com.example.dossiermedicale.Services;

import com.example.dossiermedicale.Entities.PrescriptionBilan;
import com.example.dossiermedicale.Enum.StatutPrescription;
import com.example.dossiermedicale.Repository.PrescriptionBilanRepository;
import com.example.dossiermedicale.Repository.ResultatLabtestRepository;
import com.example.dossiermedicale.dto.PrescriptionBilanDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PrescriptionBilanService {

    private final PrescriptionBilanRepository prescriptionBilanRepository;
    private final ResultatLabtestRepository resultatLabtestRepository;

    private PrescriptionBilanDTO toDTO(PrescriptionBilan e) {
        PrescriptionBilanDTO dto = new PrescriptionBilanDTO();
        dto.setId(e.getId());
        dto.setDossierId(e.getDossierId());
        dto.setMedecinId(e.getMedecinId());
        dto.setDatePrescription(e.getDatePrescription());
        dto.setTypeBilan(e.getTypeBilan());
        dto.setExamens(e.getExamens() != null ? List.copyOf(e.getExamens()) : List.of());
        dto.setUrgence(e.getUrgence());
        dto.setLaboId(e.getLaboId());
        dto.setStatut(e.getStatut());
        dto.setNoteClinique(e.getNoteClinique());
        return dto;
    }

    private PrescriptionBilan toEntity(PrescriptionBilanDTO dto) {
        PrescriptionBilan e = PrescriptionBilan.builder()
                .dossierId(dto.getDossierId())
                .medecinId(dto.getMedecinId())
                .datePrescription(dto.getDatePrescription() != null ? dto.getDatePrescription() : java.time.LocalDateTime.now())
                .typeBilan(dto.getTypeBilan())
                .examens(dto.getExamens() != null ? new java.util.ArrayList<>(dto.getExamens()) : new java.util.ArrayList<>())
                .urgence(dto.getUrgence() != null ? dto.getUrgence() : false)
                .laboId(dto.getLaboId())
                .statut(dto.getStatut() != null ? dto.getStatut() : StatutPrescription.EN_ATTENTE)
                .noteClinique(dto.getNoteClinique())
                .build();
        if (dto.getId() != null) e.setId(dto.getId());
        return e;
    }

    public PrescriptionBilanDTO create(PrescriptionBilanDTO dto) {
        dto.setStatut(StatutPrescription.EN_ATTENTE);
        PrescriptionBilan saved = prescriptionBilanRepository.save(toEntity(dto));
        return toDTO(saved);
    }

    public PrescriptionBilanDTO update(Long id, PrescriptionBilanDTO dto) {
        PrescriptionBilan e = prescriptionBilanRepository.findById(id).orElseThrow(() -> new RuntimeException("Prescription non trouvée: " + id));
        e.setTypeBilan(dto.getTypeBilan());
        e.setExamens(dto.getExamens() != null ? new java.util.ArrayList<>(dto.getExamens()) : e.getExamens());
        e.setUrgence(dto.getUrgence() != null ? dto.getUrgence() : e.getUrgence());
        e.setNoteClinique(dto.getNoteClinique());
        if (dto.getStatut() != null) e.setStatut(dto.getStatut());
        return toDTO(prescriptionBilanRepository.save(e));
    }

    /** Met à jour le statut de la prescription selon les résultats reçus (PARTIEL / COMPLET). */
    public void mettreAJourStatut(Long prescriptionId) {
        PrescriptionBilan p = prescriptionBilanRepository.findById(prescriptionId).orElse(null);
        if (p == null) return;
        int nbExamensDemandes = p.getExamens() != null ? p.getExamens().size() : 0;
        if (nbExamensDemandes == 0) return;
        long nbResultats = resultatLabtestRepository.findByPrescriptionIdOrderByDateRenduDesc(prescriptionId).stream()
                .map(r -> r.getCodeLoinc())
                .distinct()
                .count();
        if (nbResultats >= nbExamensDemandes) p.setStatut(StatutPrescription.COMPLET);
        else if (nbResultats > 0) p.setStatut(StatutPrescription.PARTIEL);
        prescriptionBilanRepository.save(p);
    }

    @Transactional(readOnly = true)
    public PrescriptionBilanDTO getById(Long id) {
        return toDTO(prescriptionBilanRepository.findById(id).orElseThrow(() -> new RuntimeException("Prescription non trouvée: " + id)));
    }

    @Transactional(readOnly = true)
    public List<PrescriptionBilanDTO> getByDossier(Long dossierId) {
        return prescriptionBilanRepository.findByDossierIdOrderByDatePrescriptionDesc(dossierId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PrescriptionBilanDTO> getByMedecin(Long medecinId) {
        return prescriptionBilanRepository.findByMedecinIdOrderByDatePrescriptionDesc(medecinId).stream().map(this::toDTO).collect(Collectors.toList());
    }
}
