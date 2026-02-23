package org.example.infectionetvaccination.Repository;


import org.example.infectionetvaccination.Entity.Infection;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InfectionRepository extends JpaRepository<Infection, Integer> {
}