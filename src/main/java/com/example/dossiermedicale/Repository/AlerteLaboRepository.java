package com.example.dossiermedicale.Repository;

import com.example.dossiermedicale.Entities.AlerteLabo;
import com.example.dossiermedicale.Enum.TypeAlerteLabo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlerteLaboRepository extends JpaRepository<AlerteLabo, Long> {

    List<AlerteLabo> findByResultatIdOrderByIdDesc(Long resultatId);
    List<AlerteLabo> findByAcquitteeParIsNullAndTypeAlerte(TypeAlerteLabo typeAlerte);
    List<AlerteLabo> findByAcquitteeParIsNull();
}
