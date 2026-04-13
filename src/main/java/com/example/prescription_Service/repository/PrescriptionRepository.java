package com.example.prescription_Service.repository;

import com.example.prescription_Service.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    // ─── Trouver par patientId ────────────────────────────────────────
    List<Prescription> findByPatientId(Long patientId);

    // ─── Trouver par patientId avec items chargés ─────────────────────
    @Query("""
        SELECT DISTINCT p
        FROM Prescription p
        LEFT JOIN FETCH p.prescriptionItems i
        LEFT JOIN FETCH i.medication
        WHERE p.patientId = :patientId
    """)
    List<Prescription> findByPatientIdWithItems(@Param("patientId") Long patientId);

    // ─── Trouver par date ─────────────────────────────────────────────
    List<Prescription> findByPrescriptionDate(LocalDate prescriptionDate);

    // ─── Trouver entre deux dates ─────────────────────────────────────
    List<Prescription> findByPrescriptionDateBetween(LocalDate startDate, LocalDate endDate);

    // ─── Trouver récentes par patientId ───────────────────────────────
    List<Prescription> findByPatientIdOrderByPrescriptionDateDesc(Long patientId);

    // ─── Trouver actives par patientId ────────────────────────────────
    @Query("""
        SELECT DISTINCT p FROM Prescription p
        LEFT JOIN FETCH p.prescriptionItems i
        LEFT JOIN FETCH i.medication
        WHERE p.patientId = :patientId
        AND i.endDate >= CURRENT_DATE
        ORDER BY p.prescriptionDate DESC
    """)
    List<Prescription> findActivePrescriptionsByPatientId(@Param("patientId") Long patientId);

    // ─── Trouver tout avec items et schedules ─────────────────────────
    @Query("""
        SELECT DISTINCT p FROM Prescription p
        LEFT JOIN FETCH p.prescriptionItems i
        LEFT JOIN FETCH i.medication
    """)
    List<Prescription> findAllWithItemsAndSchedules();
}