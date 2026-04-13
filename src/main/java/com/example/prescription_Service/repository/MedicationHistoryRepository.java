package com.example.prescription_Service.repository;

import com.example.prescription_Service.entity.MedicationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MedicationHistoryRepository extends JpaRepository<MedicationHistory, Long> {

    // ── Existants (inchangés) ──────────────────────────────────
    List<MedicationHistory> findByPatientId(Long patientId);
    List<MedicationHistory> findByPatientIdOrderByTakenAtDesc(Long patientId);
    List<MedicationHistory> findByPrescriptionItemId(Long prescriptionItemId);
    List<MedicationHistory> findByStatus(String status);
    List<MedicationHistory> findByPatientIdAndStatus(Long patientId, String status);
    List<MedicationHistory> findByTakenAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    List<MedicationHistory> findByPatientIdAndTakenAtBetween(Long patientId, LocalDateTime startDate, LocalDateTime endDate);
    List<MedicationHistory> findBySideEffectsIsNotNull();
    List<MedicationHistory> findByPatientIdAndSideEffectsIsNotNull(Long patientId);
    int countByPrescriptionItemIdAndStatus(Long id, String status);
    boolean existsByPrescriptionItemIdAndTakenAtBetween(Long id, LocalDateTime start, LocalDateTime end);
    List<MedicationHistory> findByPatientIdAndStatusAndTakenAtBefore(Long patientId, String status, LocalDateTime takenAt);

    // ══════════════════════════════════════════════════════════
    // ➕ NOUVEAU 1 — Historique du jour pour un patient
    //    Utilisé par GET /patient/{id}/date-range
    //    startDate = 2026-02-26T00:00:00
    //    endDate   = 2026-02-26T23:59:59
    // ══════════════════════════════════════════════════════════
    @Query("""
        SELECT h FROM MedicationHistory h
        WHERE h.patientId = :patientId
          AND h.takenAt BETWEEN :start AND :end
        ORDER BY h.takenAt ASC
        """)
    List<MedicationHistory> findTodayByPatient(
            @Param("patientId") Long patientId,
            @Param("start")     LocalDateTime start,
            @Param("end")       LocalDateTime end
    );

    // ══════════════════════════════════════════════════════════
    // ➕ NOUVEAU 2 — Immunosuppresseurs manqués
    //    Utilisé par DoctorAlertService (alerte médecin)
    //    Condition : isImmunosuppressor=true AND status=MISSED
    // ══════════════════════════════════════════════════════════
    @Query("""
        SELECT h FROM MedicationHistory h
        JOIN h.prescriptionItem pi
        JOIN pi.medication m
        WHERE h.patientId          = :patientId
          AND h.status             = 'MISSED'
          AND m.isImmunosuppressor = true
          AND h.takenAt           >= :since
        ORDER BY h.takenAt DESC
        """)
    List<MedicationHistory> findMissedImmunosuppressors(
            @Param("patientId") Long patientId,
            @Param("since")     LocalDateTime since
    );
}