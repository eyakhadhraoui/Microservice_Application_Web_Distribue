package com.example.dossiermedicale.Repository;

import com.example.dossiermedicale.Entities.ResultatLabtest;
import com.example.dossiermedicale.Enum.StatutInterpretation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResultatLabtestRepository extends JpaRepository<ResultatLabtest, Long> {

    List<ResultatLabtest> findByPrescriptionIdOrderByDateRenduDesc(Long prescriptionId);
    List<ResultatLabtest> findByDossierIdOrderByDateRenduDesc(Long dossierId);
    List<ResultatLabtest> findByDossierIdAndPrescriptionIdIsNullOrderByDateRenduDesc(Long dossierId);
    List<ResultatLabtest> findByDossierIdAndStatutInterpretation(Long dossierId, StatutInterpretation statut);
}
