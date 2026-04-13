package com.example.prescription_Service.repository;

import com.example.prescription_Service.entity.DosageAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DosageAdjustmentRepository extends JpaRepository<DosageAdjustment, Long> {

    // Toutes les suggestions par status (PENDING / APPROVED / REJECTED)
    List<DosageAdjustment> findByStatus(String status);

    // Suggestions par patient et status
    List<DosageAdjustment> findByPatientIdAndStatus(Long patientId, String status);

    // Historique pour un item de prescription
    List<DosageAdjustment> findByPrescriptionItemIdOrderByCreatedAtDesc(Long prescriptionItemId);

    // Compter les PENDING
    long countByStatus(String status);

    // Vérifier si déjà une suggestion PENDING pour cet item (anti-doublon)
    boolean existsByPrescriptionItemIdAndStatus(Long prescriptionItemId, String status);

    // JPQL — trier par urgence (grand écart en premier)
    @Query("""
        SELECT d FROM DosageAdjustment d
        WHERE d.status = 'PENDING'
        ORDER BY ABS(d.suggestedDose - d.currentDose) / d.currentDose DESC
    """)
    List<DosageAdjustment> findPendingOrderedByUrgency();

    // JPQL — changements significatifs > 10%
    @Query("""
        SELECT d FROM DosageAdjustment d
        WHERE d.status = 'PENDING'
        AND ABS(d.suggestedDose - d.currentDose) / d.currentDose > 0.10
        ORDER BY d.createdAt DESC
    """)
    List<DosageAdjustment> findSignificantAdjustments();

    // JPQL — statistiques approuvés par patient
    @Query("""
        SELECT d.patientId, COUNT(d), AVG(d.suggestedDose - d.currentDose)
        FROM DosageAdjustment d
        WHERE d.status = 'APPROVED'
        GROUP BY d.patientId
        ORDER BY COUNT(d) DESC
    """)
    List<Object[]> getApprovedStatsByPatient();
}