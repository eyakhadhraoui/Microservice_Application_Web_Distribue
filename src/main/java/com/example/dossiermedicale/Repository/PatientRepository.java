package com.example.dossiermedicale.Repository;

import com.example.dossiermedicale.Entities.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}
