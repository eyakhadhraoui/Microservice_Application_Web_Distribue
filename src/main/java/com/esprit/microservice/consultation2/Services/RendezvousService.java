package com.esprit.microservice.consultation2.Services;

import com.esprit.microservice.consultation2.Repository.IConsultationRepo;
import com.esprit.microservice.consultation2.Repository.IRendezvousRepo;
import com.esprit.microservice.consultation2.dto.RendezvousDTO;
import com.esprit.microservice.consultation2.entity.Consultation;
import com.esprit.microservice.consultation2.entity.Rendezvous;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RendezvousService implements IRendezvousInterface {

    private final IRendezvousRepo rendezvousRepo;
    private final IConsultationRepo consultatonRepo;
    private final IRendezvousRepo rendezvousRepo12;
    private final IRendezvousRepo rendezvousRepo13;


    @Override
    public List<Rendezvous> retrieveRendezvous() {
        return rendezvousRepo.findAll();
    }

    @Override
    public Rendezvous addRendezvous(RendezvousDTO dto) {

        Rendezvous r = new Rendezvous();
        r.setDateRendezvous(dto.getDateRendezvous());
        r.setEtat(dto.getEtat());

        if (dto.getIdConsultation() != null) {
            Consultation consultation = consultatonRepo.findById(dto.getIdConsultation())
                    .orElseThrow(() -> new RuntimeException("Consultation non trouvée avec ID : " + dto.getIdConsultation()));
            r.setConsultation(consultation);
        }

        return rendezvousRepo.save(r);
    }

    @Override
    public Rendezvous updateRendezvous(RendezvousDTO dto) {

        Rendezvous existingRdv = rendezvousRepo.findById(dto.getIdRendezvous())
                .orElseThrow(() -> new RuntimeException("Rendez-vous non trouvé avec ID : " + dto.getIdRendezvous()));

        existingRdv.setDateRendezvous(dto.getDateRendezvous());
        existingRdv.setEtat(dto.getEtat());

        if (dto.getIdConsultation() != null) {
            Consultation consultation = consultatonRepo.findById(dto.getIdConsultation())
                    .orElseThrow(() -> new RuntimeException("Consultation non trouvée avec ID : " + dto.getIdConsultation()));
            existingRdv.setConsultation(consultation);
        }

        return rendezvousRepo.save(existingRdv);
    }

    @Override
    public Optional<Rendezvous> retrieveRendezvousById(Integer idRendezvous) {
        return rendezvousRepo.findById(idRendezvous);
    }

    @Override
    public void removeRendezvous(Integer idRendezvous) {
        if (!rendezvousRepo.existsById(idRendezvous)) {
            throw new RuntimeException("Rendez-vous non trouvé avec ID : " + idRendezvous);
        }
        rendezvousRepo.deleteById(idRendezvous);
    }
}

