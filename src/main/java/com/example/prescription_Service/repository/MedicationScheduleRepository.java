package com.example.prescription_Service.repository;

import com.example.prescription_Service.entity.MedicationSchedule;
import com.example.prescription_Service.entity.PrescriptionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicationScheduleRepository extends JpaRepository<MedicationSchedule, Long> {

    List<MedicationSchedule> findByPrescriptionItem(PrescriptionItem prescriptionItem);

    void deleteByPrescriptionItem(PrescriptionItem prescriptionItem);
    List<MedicationSchedule> findByPrescriptionItemId(Long prescriptionItemId);
}