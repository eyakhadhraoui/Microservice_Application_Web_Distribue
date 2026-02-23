package com.example.prescription_Service.repository;

import com.example.prescription_Service.entity.MedicationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MedicationHistoryRepository extends JpaRepository<MedicationHistory, Long> {

    // Trouver l'historique d'un patient
    List<MedicationHistory> findByPatientId(Long patientId);

    // Trouver l'historique d'un patient ordonné par date
    List<MedicationHistory> findByPatientIdOrderByTakenAtDesc(Long patientId);

    // Trouver l'historique d'un prescription item
    List<MedicationHistory> findByPrescriptionItemId(Long prescriptionItemId);

    // Trouver par statut
    List<MedicationHistory> findByStatus(String status);

    // Trouver les prises d'un patient par statut
    List<MedicationHistory> findByPatientIdAndStatus(Long patientId, String status);

    // Trouver l'historique entre deux dates
    List<MedicationHistory> findByTakenAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    // Trouver l'historique d'un patient entre deux dates
    List<MedicationHistory> findByPatientIdAndTakenAtBetween(Long patientId,
                                                             LocalDateTime startDate,
                                                             LocalDateTime endDate);

    // Trouver les prises avec effets secondaires
    List<MedicationHistory> findBySideEffectsIsNotNull();

    // Trouver les prises avec effets secondaires pour un patient
    List<MedicationHistory> findByPatientIdAndSideEffectsIsNotNull(Long patientId);
}