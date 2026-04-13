package com.example.prescription_Service.repository;

import com.example.prescription_Service.entity.DoctorAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DoctorAlertRepository extends JpaRepository<DoctorAlert, Long> {

    // ── KEYWORDS Spring Data ─────────────────────────────────────

    // Toutes les alertes non lues
    List<DoctorAlert> findByIsReadFalse();

    // Alertes d'un patient
    List<DoctorAlert> findByPatientId(Long patientId);

    // Alertes non lues d'un patient
    List<DoctorAlert> findByPatientIdAndIsReadFalse(Long patientId);

    // Alertes critiques non lues (immunosuppresseurs)
    List<DoctorAlert> findByIsImmunosuppressorTrueAndIsReadFalse();

    // Alertes par sévérité
    List<DoctorAlert> findBySeverityAndIsReadFalse(String severity);

    // Alertes par type
    List<DoctorAlert> findByAlertTypeAndPatientId(String alertType, Long patientId);

    // Compter alertes non lues
    long countByIsReadFalse();

    // Compter alertes critiques non lues
    long countByIsImmunosuppressorTrueAndIsReadFalse();

    // Vérifier si alerte déjà générée aujourd'hui pour ce patient+médicament
    boolean existsByPatientIdAndPrescriptionItemIdAndTriggeredAtBetween(
            Long patientId,
            Long prescriptionItemId,
            LocalDateTime start,
            LocalDateTime end
    );

    // ── JPQL ─────────────────────────────────────────────────────

    // Alertes récentes (dernières 24h) non lues, triées par sévérité CRITICAL en premier
    @Query("""
        SELECT a FROM DoctorAlert a
        WHERE a.isRead = false
          AND a.triggeredAt >= :since
        ORDER BY
            CASE a.severity WHEN 'CRITICAL' THEN 0 ELSE 1 END,
            a.triggeredAt DESC
    """)
    List<DoctorAlert> findRecentUnreadOrderedBySeverity(@Param("since") LocalDateTime since);

    // Patients avec le plus de jours consécutifs manqués
    @Query("""
        SELECT a FROM DoctorAlert a
        WHERE a.alertType = 'CONSECUTIVE'
          AND a.missedDaysCount >= :minDays
        ORDER BY a.missedDaysCount DESC
    """)
    List<DoctorAlert> findConsecutiveMissedAbove(@Param("minDays") int minDays);

    // Résumé par patient : nombre total d'alertes non lues
    @Query("""
        SELECT a.patientId, COUNT(a)
        FROM DoctorAlert a
        WHERE a.isRead = false
        GROUP BY a.patientId
        ORDER BY COUNT(a) DESC
    """)
    List<Object[]> countUnreadGroupedByPatient();

    // Alertes immunosuppresseurs des 7 derniers jours
    @Query("""
        SELECT a FROM DoctorAlert a
        WHERE a.isImmunosuppressor = true
          AND a.triggeredAt >= :weekAgo
        ORDER BY a.triggeredAt DESC
    """)
    List<DoctorAlert> findImmunoAlertsLastWeek(@Param("weekAgo") LocalDateTime weekAgo);
}

