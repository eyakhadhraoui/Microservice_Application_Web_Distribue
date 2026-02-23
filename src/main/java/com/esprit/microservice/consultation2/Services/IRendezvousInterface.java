package com.esprit.microservice.consultation2.Services;

import com.esprit.microservice.consultation2.dto.RendezvousDTO;
import com.esprit.microservice.consultation2.entity.Rendezvous;

import java.util.List;
import java.util.Optional;

public interface IRendezvousInterface {
    List<Rendezvous> retrieveRendezvous();

    Rendezvous addRendezvous(RendezvousDTO dto);

    Rendezvous updateRendezvous(RendezvousDTO rendezvousDTO);
    Optional<Rendezvous> retrieveRendezvousById(Integer idRendezvous);

    void removeRendezvous(Integer idRendezvous);
}
