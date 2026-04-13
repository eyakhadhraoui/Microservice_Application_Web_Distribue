package com.example.prescription_Service.service;

import com.example.prescription_Service.entity.MedicationSchedule;
import com.example.prescription_Service.dto.PrescriptionDTO;
import com.example.prescription_Service.dto.PrescriptionItemDTO;
import com.example.prescription_Service.entity.Prescription;
import com.example.prescription_Service.entity.PrescriptionItem;
import com.example.prescription_Service.repository.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;

    // ─── toDTO simple ─────────────────────────────────────────────────
    private PrescriptionDTO toDTO(Prescription prescription) {
        PrescriptionDTO dto = new PrescriptionDTO();
        dto.setId(prescription.getId());
        dto.setPatientId(prescription.getPatientId());        // ← patientId
        dto.setPrescriptionDate(prescription.getPrescriptionDate());
        dto.setNotes(prescription.getNotes());
        return dto;
    }

    // ─── toDTO avec items ─────────────────────────────────────────────
    private PrescriptionDTO mapToDTO(Prescription p) {
        PrescriptionDTO dto = new PrescriptionDTO();
        dto.setId(p.getId());
        dto.setPatientId(p.getPatientId());                   // ← patientId
        dto.setPrescriptionDate(p.getPrescriptionDate());
        dto.setNotes(p.getNotes());

        if (p.getPrescriptionItems() != null) {
            dto.setPrescriptionItems(
                    p.getPrescriptionItems().stream()
                            .map(this::mapItemToDTO)
                            .collect(Collectors.toList())
            );
        }
        return dto;
    }

    // ─── toEntity ─────────────────────────────────────────────────────
    private Prescription toEntity(PrescriptionDTO dto) {
        Prescription prescription = new Prescription();
        prescription.setPatientId(dto.getPatientId());        // ← patientId
        prescription.setPrescriptionDate(dto.getPrescriptionDate());
        prescription.setNotes(dto.getNotes());
        return prescription;
    }

    // ─── mapItemToDTO ─────────────────────────────────────────────────
    private PrescriptionItemDTO mapItemToDTO(PrescriptionItem item) {
        PrescriptionItemDTO dto = new PrescriptionItemDTO();
        dto.setId(item.getId());
        dto.setMedicationId(item.getMedication().getId());
        dto.setMedicationName(item.getMedication().getName());
        dto.setDosageInstructions(item.getDosageInstructions());
        dto.setFrequency(item.getFrequency());
        dto.setAdministrationRoute(item.getAdministrationRoute());
        dto.setDuration(item.getDuration());
        dto.setStartDate(item.getStartDate());
        dto.setEndDate(item.getEndDate());
        dto.setSpecialInstructions(item.getSpecialInstructions());
        dto.setIsPriority(item.getIsPriority());
        dto.setIsImmunosuppressor(item.getIsImmunosuppressor());

        if (item.getSchedules() != null) {
            dto.setScheduledTimes(
                    item.getSchedules().stream()
                            .map(MedicationSchedule::getScheduledTime)
                            .collect(Collectors.toList())
            );
        }
        return dto;
    }

    // ─── CREATE ───────────────────────────────────────────────────────
    public PrescriptionDTO createPrescription(PrescriptionDTO dto) {
        Prescription saved = prescriptionRepository.save(toEntity(dto));
        return toDTO(saved);
    }

    // ─── UPDATE ───────────────────────────────────────────────────────
    public PrescriptionDTO updatePrescription(Long id, PrescriptionDTO dto) {
        Prescription existing = prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription non trouvée : " + id));
        existing.setPatientId(dto.getPatientId());            // ← patientId
        existing.setPrescriptionDate(dto.getPrescriptionDate());
        existing.setNotes(dto.getNotes());
        return toDTO(prescriptionRepository.save(existing));
    }

    // ─── READ BY ID ───────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public PrescriptionDTO getPrescriptionById(Long id) {
        return toDTO(prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription non trouvée : " + id)));
    }

    // ─── READ ALL ─────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<PrescriptionDTO> getAllPrescriptions() {
        return prescriptionRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ─── READ BY PATIENT ──────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<PrescriptionDTO> getByPatientId(Long patientId) {
        return prescriptionRepository.findByPatientId(patientId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ─── READ BY DATE RANGE ───────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<PrescriptionDTO> getPrescriptionsBetweenDates(LocalDate start, LocalDate end) {
        return prescriptionRepository.findByPrescriptionDateBetween(start, end).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ─── READ WITH ITEMS ──────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<PrescriptionDTO> getByMedicalRecord(Long patientId) {
        return prescriptionRepository.findByPatientIdWithItems(patientId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ─── READ ACTIVE ──────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<PrescriptionDTO> getActivePrescriptions(Long patientId) {
        return prescriptionRepository.findActivePrescriptionsByPatientId(patientId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ─── READ RECENT ──────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<PrescriptionDTO> getRecentPrescriptionsByMedicalRecord(Long patientId) {
        return prescriptionRepository.findByPatientIdOrderByPrescriptionDateDesc(patientId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ─── DELETE ───────────────────────────────────────────────────────
    public void deletePrescription(Long id) {
        if (!prescriptionRepository.existsById(id))
            throw new RuntimeException("Prescription non trouvée : " + id);
        prescriptionRepository.deleteById(id);
    }
}