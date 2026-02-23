package com.esprit.microservice.consultation2.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RendezvousDTO {
    private Integer idRendezvous;
    private Date dateRendezvous;
    private String etat;
    private Integer idConsultation; // liaison avec Consultation
}
