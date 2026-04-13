package com.example.prescription_Service.repository;

import com.example.prescription_Service.entity.PatientWeight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientWeightRepository extends JpaRepository<PatientWeight, Long> {

    // Dernier poids d'un patient
    Optional<PatientWeight> findTopByPatientIdOrderByMeasuredAtDesc(Long patientId);

    // Historique complet
    List<PatientWeight> findByPatientIdOrderByMeasuredAtDesc(Long patientId);

    // Les 2 derniers poids pour comparer
    @Query("""
        SELECT pw FROM PatientWeight pw
        WHERE pw.patientId = :patientId
        ORDER BY pw.measuredAt DESC
        LIMIT 2
    """)
    List<PatientWeight> findLastTwoWeights(@Param("patientId") Long patientId);

    // Tous les patients qui ont au moins un poids enregistré
    @Query("""
        SELECT DISTINCT pw.patientId FROM PatientWeight pw
    """)
    List<Long> findAllPatientsWithWeightHistory();
}