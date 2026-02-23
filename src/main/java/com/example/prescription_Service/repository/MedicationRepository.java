package com.example.prescription_Service.repository;

import com.example.prescription_Service.entity.Medication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicationRepository extends JpaRepository<Medication, Long> {

    // Rechercher par nom
    List<Medication> findByNameContainingIgnoreCase(String name);

    // Rechercher par catégorie
    List<Medication> findByCategory(String category);

    // Rechercher les médicaments nécessitant une surveillance
    List<Medication> findByRequiresMonitoring(Boolean requiresMonitoring);

    // Rechercher par principe actif
    List<Medication> findByActiveIngredientContainingIgnoreCase(String activeIngredient);
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}