package com.esprit.microservice.consultation2.Services;

import com.esprit.microservice.consultation2.dto.RapportDTO;
import com.esprit.microservice.consultation2.entity.Rapport;

import java.util.List;
import java.util.Optional;

public interface IRapportInterface {
    List<Rapport> retrieveRapports();

    Rapport addRapport(RapportDTO dto);

    Rapport updateRapport(RapportDTO rapportDTO);

    Optional<Rapport> retrieveRapport(Integer idRapport);

    void removeRapport(Integer idRapport);
}
