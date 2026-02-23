package com.example.prescription_Service.service;

import com.example.prescription_Service.dto.PrescriptionDTO;
import com.example.prescription_Service.entity.Prescription;
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

    // Convertir Entity → DTO
    private PrescriptionDTO toDTO(Prescription prescription) {
        PrescriptionDTO dto = new PrescriptionDTO();
        dto.setId(prescription.getId());
        dto.setMedicalRecordId(prescription.getMedicalRecordId());
        dto.setPrescriptionDate(prescription.getPrescriptionDate());
        dto.setNotes(prescription.getNotes());
        return dto;
    }

    // Convertir DTO → Entity
    private Prescription toEntity(PrescriptionDTO dto) {
        Prescription prescription = new Prescription();
        prescription.setMedicalRecordId(dto.getMedicalRecordId());
        prescription.setPrescriptionDate(dto.getPrescriptionDate());
        prescription.setNotes(dto.getNotes());
        return prescription;
    }

    // Créer une prescription
    public PrescriptionDTO createPrescription(PrescriptionDTO prescriptionDTO) {
        Prescription prescription = toEntity(prescriptionDTO);
        Prescription savedPrescription = prescriptionRepository.save(prescription);
        return toDTO(savedPrescription);
    }

    // Mettre à jour une prescription
    public PrescriptionDTO updatePrescription(Long id, PrescriptionDTO prescriptionDTO) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription non trouvée avec l'ID: " + id));

        prescription.setMedicalRecordId(prescriptionDTO.getMedicalRecordId());
        prescription.setPrescriptionDate(prescriptionDTO.getPrescriptionDate());
        prescription.setNotes(prescriptionDTO.getNotes());

        Prescription updatedPrescription = prescriptionRepository.save(prescription);
        return toDTO(updatedPrescription);
    }

    // Récupérer une prescription par ID
    @Transactional(readOnly = true)
    public PrescriptionDTO getPrescriptionById(Long id) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription non trouvée avec l'ID: " + id));
        return toDTO(prescription);
    }

    // Récupérer toutes les prescriptions
    @Transactional(readOnly = true)
    public List<PrescriptionDTO> getAllPrescriptions() {
        return prescriptionRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Récupérer par dossier médical
    @Transactional(readOnly = true)
    public List<PrescriptionDTO> getByMedicalRecordId(Long medicalRecordId) {
        return prescriptionRepository.findByMedicalRecordId(medicalRecordId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Récupérer les prescriptions récentes
    @Transactional(readOnly = true)
    public List<PrescriptionDTO> getRecentPrescriptionsByMedicalRecord(Long medicalRecordId) {
        return prescriptionRepository.findByMedicalRecordIdOrderByPrescriptionDateDesc(medicalRecordId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Récupérer entre deux dates
    @Transactional(readOnly = true)
    public List<PrescriptionDTO> getPrescriptionsBetweenDates(LocalDate startDate, LocalDate endDate) {
        return prescriptionRepository.findByPrescriptionDateBetween(startDate, endDate).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Supprimer une prescription
    public void deletePrescription(Long id) {
        if (!prescriptionRepository.existsById(id)) {
            throw new RuntimeException("Prescription non trouvée avec l'ID: " + id);
        }
        prescriptionRepository.deleteById(id);
    }
}