package com.example.prescription_Service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MedecinDTO {
    private Long idMedecin;
    private String username;
    private String nom;
    private String prenom;
}