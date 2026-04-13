package com.example.prescription_Service.repository;

import com.example.prescription_Service.entity.MedicationSchedule;
import com.example.prescription_Service.entity.PrescriptionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PrescriptionItemRepository extends JpaRepository<PrescriptionItem, Long> {

    // Trouver tous les items d'une prescription
    List<PrescriptionItem> findByPrescriptionId(Long prescriptionId);

    // Trouver tous les items contenant un médicament spécifique
    List<PrescriptionItem> findByMedicationId(Long medicationId);
    // Trouver les médicaments prioritaires d'une prescription
    List<PrescriptionItem> findByPrescriptionIdAndIsPriority(Long prescriptionId, Boolean isPriority);

    // Trouver les items actifs (en cours) à une date donnée
    List<PrescriptionItem> findByStartDateLessThanEqualAndEndDateGreaterThanEqual(LocalDate date1, LocalDate date2);
    // Ajouter cette méthode à ton repository existant
    List<PrescriptionItem> findByPrescriptionIdAndIsImmunosuppressor(Long prescriptionId, Boolean isImmunosuppressor);
}