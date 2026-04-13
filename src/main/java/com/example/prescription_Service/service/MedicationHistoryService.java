package com.example.prescription_Service.service;

import com.example.prescription_Service.dto.MedicationHistoryDTO;
import com.example.prescription_Service.entity.MedicationHistory;
import com.example.prescription_Service.entity.PrescriptionItem;
import com.example.prescription_Service.repository.MedicationHistoryRepository;
import com.example.prescription_Service.repository.PrescriptionItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MedicationHistoryService {

    private final MedicationHistoryRepository medicationHistoryRepository;
    private final PrescriptionItemRepository prescriptionItemRepository;

    // Convertir Entity → DTO (avec vérifications de null)
    private MedicationHistoryDTO toDTO(MedicationHistory history) {
        MedicationHistoryDTO dto = new MedicationHistoryDTO();
        dto.setId(history.getId());
        dto.setPatientId(history.getPatientId());
        dto.setTakenAt(history.getTakenAt());
        dto.setStatus(history.getStatus());
        dto.setActualDosage(history.getActualDosage());
        dto.setNotes(history.getNotes());
        dto.setAdministeredBy(history.getAdministeredBy());
        dto.setSideEffects(history.getSideEffects());
        dto.setTemperature(history.getTemperature());
        dto.setVitalSigns(history.getVitalSigns());

        // Ajouter les infos enrichies avec vérification de null
        if (history.getPrescriptionItem() != null) {
            PrescriptionItem item = history.getPrescriptionItem();
            dto.setPrescriptionItemId(item.getId());
            dto.setDosageInstructions(item.getDosageInstructions());

            // Vérifier si le médicament existe
            if (item.getMedication() != null) {
                dto.setMedicationName(item.getMedication().getName());
                dto.setMedicationCategory(item.getMedication().getCategory());
            }

            // Vérifier si la prescription existe
            if (item.getPrescription() != null) {
                dto.setPrescriptionId(item.getPrescription().getId());
            }
        }

        return dto;
    }

    // Convertir DTO → Entity
    private MedicationHistory toEntity(MedicationHistoryDTO dto) {
        MedicationHistory history = new MedicationHistory();

        PrescriptionItem prescriptionItem = prescriptionItemRepository.findById(dto.getPrescriptionItemId())
                .orElseThrow(() -> new RuntimeException("Prescription item non trouvé avec l'ID: " + dto.getPrescriptionItemId()));

        history.setPrescriptionItem(prescriptionItem);
        history.setPatientId(dto.getPatientId());
        history.setTakenAt(dto.getTakenAt());
        history.setStatus(dto.getStatus());
        history.setActualDosage(dto.getActualDosage());
        history.setNotes(dto.getNotes());
        history.setAdministeredBy(dto.getAdministeredBy());
        history.setSideEffects(dto.getSideEffects());
        history.setTemperature(dto.getTemperature());
        history.setVitalSigns(dto.getVitalSigns());

        return history;
    }

    // Créer un historique
    public MedicationHistoryDTO createMedicationHistory(MedicationHistoryDTO medicationHistoryDTO) {
        MedicationHistory history = toEntity(medicationHistoryDTO);
        MedicationHistory savedHistory = medicationHistoryRepository.save(history);
        return toDTO(savedHistory);
    }

    // Mettre à jour un historique
    public MedicationHistoryDTO updateMedicationHistory(Long id, MedicationHistoryDTO medicationHistoryDTO) {
        MedicationHistory history = medicationHistoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Historique non trouvé avec l'ID: " + id));

        // Vérifier si le prescription item a changé
        if (history.getPrescriptionItem() != null &&
                !history.getPrescriptionItem().getId().equals(medicationHistoryDTO.getPrescriptionItemId())) {
            PrescriptionItem newItem = prescriptionItemRepository.findById(medicationHistoryDTO.getPrescriptionItemId())
                    .orElseThrow(() -> new RuntimeException("Prescription item non trouvé avec l'ID: " + medicationHistoryDTO.getPrescriptionItemId()));
            history.setPrescriptionItem(newItem);
        }

        history.setPatientId(medicationHistoryDTO.getPatientId());
        history.setTakenAt(medicationHistoryDTO.getTakenAt());
        history.setStatus(medicationHistoryDTO.getStatus());
        history.setActualDosage(medicationHistoryDTO.getActualDosage());
        history.setNotes(medicationHistoryDTO.getNotes());
        history.setAdministeredBy(medicationHistoryDTO.getAdministeredBy());
        history.setSideEffects(medicationHistoryDTO.getSideEffects());
        history.setTemperature(medicationHistoryDTO.getTemperature());
        history.setVitalSigns(medicationHistoryDTO.getVitalSigns());

        MedicationHistory updatedHistory = medicationHistoryRepository.save(history);
        return toDTO(updatedHistory);
    }

    // Récupérer un historique par ID
    @Transactional(readOnly = true)
    public MedicationHistoryDTO getMedicationHistoryById(Long id) {
        MedicationHistory history = medicationHistoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Historique non trouvé avec l'ID: " + id));
        return toDTO(history);
    }

    // Récupérer tout l'historique
    @Transactional(readOnly = true)
    public List<MedicationHistoryDTO> getAllMedicationHistory() {
        return medicationHistoryRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Récupérer par patient
    @Transactional(readOnly = true)
    public List<MedicationHistoryDTO> getByPatientId(Long patientId) {
        return medicationHistoryRepository.findByPatientIdOrderByTakenAtDesc(patientId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Récupérer par prescription item
    @Transactional(readOnly = true)
    public List<MedicationHistoryDTO> getByPrescriptionItemId(Long prescriptionItemId) {
        return medicationHistoryRepository.findByPrescriptionItemId(prescriptionItemId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Récupérer par statut
    @Transactional(readOnly = true)
    public List<MedicationHistoryDTO> getByStatus(String status) {
        return medicationHistoryRepository.findByStatus(status).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Récupérer par patient et statut
    @Transactional(readOnly = true)
    public List<MedicationHistoryDTO> getByPatientIdAndStatus(Long patientId, String status) {
        return medicationHistoryRepository.findByPatientIdAndStatus(patientId, status).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Récupérer entre deux dates
    @Transactional(readOnly = true)
    public List<MedicationHistoryDTO> getHistoryBetweenDates(LocalDateTime startDate, LocalDateTime endDate) {
        return medicationHistoryRepository.findByTakenAtBetween(startDate, endDate).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Récupérer par patient entre deux dates
    @Transactional(readOnly = true)
    public List<MedicationHistoryDTO> getPatientHistoryBetweenDates(Long patientId, LocalDateTime startDate, LocalDateTime endDate) {
        return medicationHistoryRepository.findByPatientIdAndTakenAtBetween(patientId, startDate, endDate).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Récupérer avec effets secondaires
    @Transactional(readOnly = true)
    public List<MedicationHistoryDTO> getWithSideEffects() {
        return medicationHistoryRepository.findBySideEffectsIsNotNull().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Récupérer par patient avec effets secondaires
    @Transactional(readOnly = true)
    public List<MedicationHistoryDTO> getPatientHistoryWithSideEffects(Long patientId) {
        return medicationHistoryRepository.findByPatientIdAndSideEffectsIsNotNull(patientId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Calculer le taux d'observance
    @Transactional(readOnly = true)
    public double calculateComplianceRate(Long patientId, LocalDateTime startDate, LocalDateTime endDate) {
        List<MedicationHistory> allRecords = medicationHistoryRepository.findByPatientIdAndTakenAtBetween(
                patientId, startDate, endDate
        );

        if (allRecords.isEmpty()) {
            return 0.0;
        }

        long takenCount = allRecords.stream()
                .filter(h -> "TAKEN".equals(h.getStatus()))
                .count();

        return (double) takenCount / allRecords.size() * 100;
    }

    // Supprimer un historique
    public void deleteMedicationHistory(Long id) {
        if (!medicationHistoryRepository.existsById(id)) {
            throw new RuntimeException("Historique non trouvé avec l'ID: " + id);
        }
        medicationHistoryRepository.deleteById(id);
    }
    public int countTakenDoses(Long prescriptionItemId) {
        return medicationHistoryRepository
                .countByPrescriptionItemIdAndStatus(
                        prescriptionItemId,
                        "TAKEN"
                );
    }
    public List<MedicationHistory> getLateDoses(Long patientId) {

        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);

        return medicationHistoryRepository
                .findByPatientIdAndStatusAndTakenAtBefore(
                        patientId,
                        "PENDING",
                        oneHourAgo
                );
    }
}