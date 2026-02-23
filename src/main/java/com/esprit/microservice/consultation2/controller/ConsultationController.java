package com.esprit.microservice.consultation2.controller;

import com.esprit.microservice.consultation2.Services.IConsultationInterface;
import com.esprit.microservice.consultation2.entity.Consultation;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@AllArgsConstructor
@RequestMapping("/consultation")
public class ConsultationController {
    @Autowired
    IConsultationInterface iConsultationInterface;

    // APIs (comme ton bloc controller)

    // Retrieve all consultations
    @GetMapping("/retrieveConsultations")
    public List<Consultation> retrieveConsultations() {
        return iConsultationInterface.retrieveConsultations();
    }

    // Add consultation
    @PostMapping("/addConsultation")
    public Consultation addConsultation(@RequestBody Consultation consultation) {
        return iConsultationInterface.addConsultation(consultation);
    }


    @PutMapping("/updateConsultation/{id}")
    public Consultation updateConsultation(
            @PathVariable("id") Integer id,
            @RequestBody Consultation consultation) {

        consultation.setIdConsultation(id); // assure que l'ID du JSON correspond à l'ID de l'URL
        return iConsultationInterface.updateConsultation(consultation);
    }


    // Retrieve consultation by id
    @GetMapping("/retrieveConsultation/{consultation-id}")
    public Optional<Consultation> retrieveConsultation(
            @PathVariable("consultation-id") Integer idConsultation) {
        return iConsultationInterface.retrieveConsultation(idConsultation);
    }

    // Delete consultation
    @DeleteMapping("/removeConsultation/{consultation-id}")
    public void removeConsultation(
            @PathVariable("consultation-id") Integer idConsultation) {
        iConsultationInterface.removeConsultation(idConsultation);
    }
}
