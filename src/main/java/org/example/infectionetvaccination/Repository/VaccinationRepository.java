package org.example.infectionetvaccination.Repository;

import org.example.infectionetvaccination.Entity.Vaccination;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VaccinationRepository extends JpaRepository<Vaccination, Integer> {
    List<Vaccination> findByInfectionId(int infectionId);
}