package com.esprit.microservice.consultation2.Services;

import com.esprit.microservice.consultation2.Repository.IConsultationRepo;
import com.esprit.microservice.consultation2.entity.Consultation;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
public class ConsultationService implements IConsultationInterface{
    @Autowired
    IConsultationRepo consultationRepo;

    @Override
    public List<Consultation> retrieveConsultations() {
        return consultationRepo.findAll();
    }

    @Override
    public Consultation addConsultation(Consultation consultation) {
        return consultationRepo.save(consultation);
    }

    @Override
    public Consultation updateConsultation(Consultation consultation) {
        // Vérifier que la consultation existe
        if(consultation.getIdConsultation() == null ||
                !consultationRepo.existsById(consultation.getIdConsultation())) {
            throw new RuntimeException("Consultation non trouvée avec ID = " + consultation.getIdConsultation());
        }

        // Sauvegarde (update)
        return consultationRepo.save(consultation);
    }


    @Override
    public Optional<Consultation> retrieveConsultation(Integer idConsultation) {
        return consultationRepo.findById(idConsultation);
    }

    @Override
    public void removeConsultation(Integer idConsultation) {
        consultationRepo.deleteById(idConsultation);
    }
}

