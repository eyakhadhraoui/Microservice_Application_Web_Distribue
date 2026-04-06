package com.example.dossiermedicale.Repository;

import com.example.dossiermedicale.Entities.RapportBilan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RapportBilanRepository extends JpaRepository<RapportBilan, Long> {

    List<RapportBilan> findByDossierIdOrderByDateGenerationDesc(Long dossierId);
    List<RapportBilan> findByDossierIdAndPartageFamilleTrueOrderByDateGenerationDesc(Long dossierId);
}
