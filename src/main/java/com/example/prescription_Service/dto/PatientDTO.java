package com.example.prescription_Service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientDTO {
    private Long idPatient;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String telephone;
    private LocalDate dateNaissance;
}