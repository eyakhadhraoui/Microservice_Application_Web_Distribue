package com.example.dossiermedicale.Repository;

import com.example.dossiermedicale.Entities.PrescriptionBilan;
import com.example.dossiermedicale.Enum.StatutPrescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrescriptionBilanRepository extends JpaRepository<PrescriptionBilan, Long> {

    List<PrescriptionBilan> findByDossierIdOrderByDatePrescriptionDesc(Long dossierId);
    List<PrescriptionBilan> findByMedecinIdOrderByDatePrescriptionDesc(Long medecinId);
    List<PrescriptionBilan> findByDossierIdAndStatut(Long dossierId, StatutPrescription statut);
}
