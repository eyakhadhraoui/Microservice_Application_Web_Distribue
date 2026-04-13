package com.example.prescription_Service.service;

import com.example.prescription_Service.dto.PrescriptionDTO;
import com.example.prescription_Service.dto.PrescriptionItemDTO;
import com.example.prescription_Service.entity.Medication;
import com.example.prescription_Service.entity.MedicationSchedule;
import com.example.prescription_Service.entity.Prescription;
import com.example.prescription_Service.entity.PrescriptionItem;
import com.example.prescription_Service.repository.MedicationRepository;
import com.example.prescription_Service.repository.MedicationScheduleRepository;
import com.example.prescription_Service.repository.PrescriptionItemRepository;
import com.example.prescription_Service.repository.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PrescriptionItemService {

    private final PrescriptionItemRepository prescriptionItemRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicationRepository medicationRepository;
    private final MedicationScheduleRepository medicationScheduleRepository;

    // ─── toDTO ───────────────────────────────────────────────────────────────
    private PrescriptionItemDTO toDTO(PrescriptionItem item) {
        PrescriptionItemDTO dto = new PrescriptionItemDTO();
        dto.setId(item.getId());
        dto.setPrescriptionId(item.getPrescription().getId());
        dto.setMedicationId(item.getMedication().getId());
        dto.setDosageInstructions(item.getDosageInstructions());
        dto.setFrequency(item.getFrequency());
        dto.setDuration(item.getDuration());
        dto.setAdministrationRoute(item.getAdministrationRoute());
        dto.setStartDate(item.getStartDate());
        dto.setEndDate(item.getEndDate());
        dto.setSpecialInstructions(item.getSpecialInstructions());
        dto.setIsPriority(item.getIsPriority());

        // ✅ NOUVEAU
        dto.setIsImmunosuppressor(item.getIsImmunosuppressor());

        // ✅ Horaires
        List<LocalTime> times = item.getSchedules().stream()
                .map(MedicationSchedule::getScheduledTime)
                .collect(Collectors.toList());
        dto.setScheduledTimes(times);

        // Infos médicament
        dto.setMedicationName(item.getMedication().getName());
        dto.setMedicationCategory(item.getMedication().getCategory());
        dto.setMedicationDosage(item.getMedication().getDosage());
        dto.setMedicationUnit(item.getMedication().getUnit());

        return dto;
    }

    // ─── toEntity ─────────────────────────────────────────────────────────────
    private PrescriptionItem toEntity(PrescriptionItemDTO dto) {
        PrescriptionItem item = new PrescriptionItem();

        Prescription prescription = prescriptionRepository.findById(dto.getPrescriptionId())
                .orElseThrow(() -> new RuntimeException("Prescription non trouvée : " + dto.getPrescriptionId()));

        Medication medication = medicationRepository.findById(dto.getMedicationId())
                .orElseThrow(() -> new RuntimeException("Médicament non trouvé : " + dto.getMedicationId()));

        item.setPrescription(prescription);
        item.setMedication(medication);
        item.setDosageInstructions(dto.getDosageInstructions());
        item.setFrequency(dto.getFrequency());
        item.setDuration(dto.getDuration());
        item.setAdministrationRoute(dto.getAdministrationRoute());
        item.setStartDate(dto.getStartDate());
        item.setEndDate(dto.getEndDate());
        item.setSpecialInstructions(dto.getSpecialInstructions());
        item.setIsPriority(dto.getIsPriority());

        // ✅ Copié automatiquement depuis Medication
        item.setIsImmunosuppressor(medication.getIsImmunosuppressor());

        return item;
    }

    // ─── Génération horaires ──────────────────────────────────────────────────
    private void saveSchedules(PrescriptionItem item, List<LocalTime> times) {
        // Supprimer anciens horaires si update
        medicationScheduleRepository.deleteByPrescriptionItem(item);

        if (times != null && !times.isEmpty()) {
            List<MedicationSchedule> schedules = times.stream()
                    .map(time -> new MedicationSchedule(item, time))
                    .collect(Collectors.toList());
            medicationScheduleRepository.saveAll(schedules);
        }
    }

    // ─── 1️⃣ CRÉER ─────────────────────────────────────────────────────────────
    public PrescriptionItemDTO createPrescriptionItem(PrescriptionItemDTO dto) {

        if (dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La date de fin doit être après la date de début"
            );
        }

        PrescriptionItem item = toEntity(dto);
        PrescriptionItem saved = prescriptionItemRepository.save(item);

        // ✅ Sauvegarde horaires
        saveSchedules(saved, dto.getScheduledTimes());

        return toDTO(saved);
    }

    // ─── 2️⃣ METTRE À JOUR ─────────────────────────────────────────────────────
    public PrescriptionItemDTO updatePrescriptionItem(Long id, PrescriptionItemDTO dto) {

        if (dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new IllegalArgumentException("La date de fin doit être après la date de début");
        }

        PrescriptionItem item = prescriptionItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item non trouvé : " + id));

        if (!item.getPrescription().getId().equals(dto.getPrescriptionId())) {
            Prescription newPrescription = prescriptionRepository.findById(dto.getPrescriptionId())
                    .orElseThrow(() -> new RuntimeException("Prescription non trouvée : " + dto.getPrescriptionId()));
            item.setPrescription(newPrescription);
        }

        if (!item.getMedication().getId().equals(dto.getMedicationId())) {
            Medication newMedication = medicationRepository.findById(dto.getMedicationId())
                    .orElseThrow(() -> new RuntimeException("Médicament non trouvé : " + dto.getMedicationId()));
            item.setMedication(newMedication);
            // ✅ Recalcule isImmunosuppressor si médicament change
            item.setIsImmunosuppressor(newMedication.getIsImmunosuppressor());
        }

        item.setDosageInstructions(dto.getDosageInstructions());
        item.setFrequency(dto.getFrequency());
        item.setDuration(dto.getDuration());
        item.setAdministrationRoute(dto.getAdministrationRoute());
        item.setStartDate(dto.getStartDate());
        item.setEndDate(dto.getEndDate());
        item.setSpecialInstructions(dto.getSpecialInstructions());
        item.setIsPriority(dto.getIsPriority());

        PrescriptionItem updated = prescriptionItemRepository.save(item);

        // ✅ Met à jour les horaires
        saveSchedules(updated, dto.getScheduledTimes());

        return toDTO(updated);
    }

    // ─── READ ──────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public PrescriptionItemDTO getPrescriptionItemById(Long id) {
        return toDTO(prescriptionItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item non trouvé : " + id)));
    }

    @Transactional(readOnly = true)
    public List<PrescriptionItemDTO> getAllPrescriptionItems() {
        return prescriptionItemRepository.findAll().stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PrescriptionItemDTO> getByPrescriptionId(Long prescriptionId) {
        return prescriptionItemRepository.findByPrescriptionId(prescriptionId).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PrescriptionItemDTO> getByMedicationId(Long medicationId) {
        return prescriptionItemRepository.findByMedicationId(medicationId).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PrescriptionItemDTO> getPriorityItems(Long prescriptionId) {
        return prescriptionItemRepository.findByPrescriptionIdAndIsPriority(prescriptionId, true).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PrescriptionItemDTO> getActiveItemsOnDate(LocalDate date) {
        return prescriptionItemRepository.findByStartDateLessThanEqualAndEndDateGreaterThanEqual(date, date).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    // ✅ NOUVEAU — Récupérer les immunosuppresseurs d'une prescription
    @Transactional(readOnly = true)
    public List<PrescriptionItemDTO> getImmunosuppresseurs(Long prescriptionId) {
        return prescriptionItemRepository.findByPrescriptionIdAndIsImmunosuppressor(prescriptionId, true).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    public void deletePrescriptionItem(Long id) {
        if (!prescriptionItemRepository.existsById(id)) {
            throw new RuntimeException("Item non trouvé : " + id);
        }
        prescriptionItemRepository.deleteById(id);
    }
    @RequiredArgsConstructor
    @Service
    public class PrescriptionService {

        private final PrescriptionRepository prescriptionRepository;
        private final PrescriptionItemService prescriptionItemService; // injecte ton service d’items

        @Transactional(readOnly = true)
        public List<PrescriptionDTO> getByMedicalRecordId(Long medicalRecordId) {
            List<Prescription> prescriptions = prescriptionRepository.findByPatientId(medicalRecordId);

            return prescriptions.stream().map(prescription -> {
                PrescriptionDTO dto = new PrescriptionDTO();
                dto.setId(prescription.getId());
                dto.setPatientId(prescription.getPatientId());
                dto.setPrescriptionDate(prescription.getPrescriptionDate());
                dto.setNotes(prescription.getNotes());

                dto.setPrescriptionItems(prescriptionItemService.getByPrescriptionId(prescription.getId()));

                return dto;
            }).collect(Collectors.toList());
        }
    }
    public int calculateTotalExpectedDoses(PrescriptionItem item) {

        long days = ChronoUnit.DAYS.between(
                item.getStartDate(),
                item.getEndDate()
        ) + 1;

        int dosesPerDay = item.getSchedules().size();

        return (int) days * dosesPerDay;
    }

}