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
public class RapportDTO {
    private Integer idRapport;
    private Date dateRapport;
    private String contenu;
    private String recommendations;
    private Integer idConsultation;
}
