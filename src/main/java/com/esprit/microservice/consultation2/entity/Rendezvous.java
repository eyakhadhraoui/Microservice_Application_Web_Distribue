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
public class Rendezvous {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idRendezvous;
    private Date dateRendezvous;
    private String etat;

    @OneToOne(cascade = CascadeType.ALL)
    private Consultation consultation;

}

