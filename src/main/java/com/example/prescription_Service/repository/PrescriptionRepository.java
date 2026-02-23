package com.example.prescription_Service.repository;

import com.example.prescription_Service.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    // Trouver toutes les prescriptions d'un dossier médical
    List<Prescription> findByMedicalRecordId(Long medicalRecordId);

    // Trouver les prescriptions par date
    List<Prescription> findByPrescriptionDate(LocalDate prescriptionDate);

    // Trouver les prescriptions entre deux dates
    List<Prescription> findByPrescriptionDateBetween(LocalDate startDate, LocalDate endDate);

    // Trouver les prescriptions récentes d'un patient (via medicalRecordId)
    List<Prescription> findByMedicalRecordIdOrderByPrescriptionDateDesc(Long medicalRecordId);
}