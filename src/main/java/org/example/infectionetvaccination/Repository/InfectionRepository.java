package org.example.infectionetvaccination.Repository;


import org.example.infectionetvaccination.Entity.Infection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InfectionRepository extends JpaRepository<Infection, Integer> {
    List<Infection> findByPatientNameIgnoreCase(String username);
}