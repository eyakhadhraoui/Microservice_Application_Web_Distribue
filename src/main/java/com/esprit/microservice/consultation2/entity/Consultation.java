package com.esprit.microservice.consultation2.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;
import java.util.List;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Consultation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idConsultation;
    private Date dateConsultation; // camelCase
    private String diagnostic;
    private String notes;
    private Integer idDossiermedical;


    @OneToMany(cascade = CascadeType.ALL, mappedBy = "consultation", orphanRemoval = true)
    private List<Rapport> rapports;
    @OneToOne
    private Rendezvous rendezvous;
}
