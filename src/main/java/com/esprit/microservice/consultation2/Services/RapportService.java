package com.esprit.microservice.consultation2.Services;

import com.esprit.microservice.consultation2.Repository.IConsultationRepo;
import com.esprit.microservice.consultation2.Repository.IRapportRepo;
import com.esprit.microservice.consultation2.dto.RapportDTO;
import com.esprit.microservice.consultation2.entity.Consultation;
import com.esprit.microservice.consultation2.entity.Rapport;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
public class RapportService implements IRapportInterface {
    @Autowired
    private IRapportRepo rapportRepo;
    private IConsultationRepo consultatonRepo;

    @Override
    public List<Rapport> retrieveRapports() {
        return rapportRepo.findAll();
    }

    @Override
    public Rapport addRapport(RapportDTO dto) {
        Rapport r = new Rapport();
        r.setDateRapport(dto.getDateRapport());
        r.setContenu(dto.getContenu());
        r.setRecommendations(dto.getRecommendations());

        // Liaison avec Consultation (comme Rendezvous)
        if (dto.getIdConsultation() != null) {
            Consultation c = consultatonRepo.findById(dto.getIdConsultation())
                    .orElseThrow(() -> new RuntimeException("Consultation non trouvée"));
            r.setConsultation(c);
        }

        return rapportRepo.save(r);
    }


    @Override
    public Rapport updateRapport(RapportDTO rapportDTO) {
        Rapport existingRapport = rapportRepo.findById(rapportDTO.getIdRapport())
                .orElseThrow(() -> new RuntimeException("Rapport non trouvé"));

        existingRapport.setDateRapport(rapportDTO.getDateRapport());
        existingRapport.setContenu(rapportDTO.getContenu());
        existingRapport.setRecommendations(rapportDTO.getRecommendations());

        // Mise à jour de la consultation si id fourni
        if (rapportDTO.getIdConsultation() != null) {
            Consultation consultation = consultatonRepo.findById(rapportDTO.getIdConsultation())
                    .orElseThrow(() -> new RuntimeException("Consultation non trouvée"));
            existingRapport.setConsultation(consultation);
        }

        return rapportRepo.save(existingRapport);
    }



    @Override
    public Optional<Rapport> retrieveRapport(Integer idRapport) {
        return rapportRepo.findById(idRapport);
    }

    @Override
    public void removeRapport(Integer idRapport) {
        rapportRepo.deleteById(idRapport);
    }
}