package com.example.prescription_Service.service;

import com.example.prescription_Service.dto.MedicationScheduleDTO;
import com.example.prescription_Service.entity.MedicationSchedule;
import com.example.prescription_Service.entity.PrescriptionItem;
import com.example.prescription_Service.repository.MedicationScheduleRepository;
import com.example.prescription_Service.repository.PrescriptionItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MedicationScheduleService {

    private final MedicationScheduleRepository medicationScheduleRepository;
    private final PrescriptionItemRepository prescriptionItemRepository;

    private MedicationScheduleDTO toDTO(MedicationSchedule schedule) {
        MedicationScheduleDTO dto = new MedicationScheduleDTO();
        dto.setId(schedule.getId());
        dto.setPrescriptionItemId(schedule.getPrescriptionItem().getId());
        dto.setScheduledTime(schedule.getScheduledTime());
        return dto;
    }

    // Récupérer horaires d'un PrescriptionItem
    @Transactional(readOnly = true)
    public List<MedicationScheduleDTO> getByPrescriptionItem(Long prescriptionItemId) {
        PrescriptionItem item = prescriptionItemRepository.findById(prescriptionItemId)
                .orElseThrow(() -> new RuntimeException("Item non trouvé : " + prescriptionItemId));

        return medicationScheduleRepository.findByPrescriptionItem(item).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Supprimer tous les horaires d'un item
    public void deleteByPrescriptionItem(Long prescriptionItemId) {
        PrescriptionItem item = prescriptionItemRepository.findById(prescriptionItemId)
                .orElseThrow(() -> new RuntimeException("Item non trouvé : " + prescriptionItemId));
        medicationScheduleRepository.deleteByPrescriptionItem(item);
    }
}