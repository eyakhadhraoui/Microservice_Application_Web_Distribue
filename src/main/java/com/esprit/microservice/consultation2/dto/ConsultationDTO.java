package com.esprit.microservice.consultation2.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ConsultationDTO {
    private Integer idConsultation;
    private Date dateConsultation;
    private String diagnostic;
    private String notes;
    private Integer idDossiermedical;
    private List<Integer> rapportIds; // juste les IDs des rapports
    private Integer rendezvousId;     // juste l'ID du rendez-vous
}
