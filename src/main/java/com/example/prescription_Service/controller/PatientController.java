package com.example.prescription_Service.controller;

import com.example.prescription_Service.dto.PatientDTO;
import com.example.prescription_Service.entity.Patient;
import com.example.prescription_Service.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientRepository patientRepository;

    @GetMapping
    public List<PatientDTO> retrievePatients() {
        return patientRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private PatientDTO toDTO(Patient p) {
        PatientDTO dto = new PatientDTO();
        dto.setIdPatient(p.getIdPatient());
        dto.setUsername(p.getUsername());
        dto.setEmail(p.getEmail());
        dto.setFirstName(p.getFirstName());
        dto.setLastName(p.getLastName());
        dto.setTelephone(p.getTelephone());
        dto.setDateNaissance(p.getDateNaissance());
        return dto;
    }
}