package com.esprit.microservice.consultation2.Services;

import com.esprit.microservice.consultation2.entity.Consultation;

import java.util.List;
import java.util.Optional;

public interface IConsultationInterface {
    List<Consultation> retrieveConsultations();

    Consultation addConsultation(Consultation consultation);

    Consultation updateConsultation(Consultation consultation);

    Optional<Consultation> retrieveConsultation(Integer idConsultation);

    void removeConsultation(Integer idConsultation);
}

