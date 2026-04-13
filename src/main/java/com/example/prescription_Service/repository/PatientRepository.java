package com.example.prescription_Service.repository;

import com.example.prescription_Service.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<Patient, Long> {}
