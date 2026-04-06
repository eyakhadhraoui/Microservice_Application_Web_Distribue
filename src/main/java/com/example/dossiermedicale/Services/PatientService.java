package com.example.dossiermedicale.Services;

import com.example.dossiermedicale.Entities.Patient;
import com.example.dossiermedicale.Repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;

/**
 * Profil patient MySQL (dossier médical). L’auth / Keycloak est gérée par le user-service Symfony.
 */
@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;

    private static String trim(String s) {
        return s != null ? s.trim() : "";
    }

    /**
     * Crée ou retourne le patient existant (appelé après inscription via Symfony / Gateway).
     */
    @Transactional
    public Patient ensureProfileFromRegistration(String username, String email, String firstName, String lastName, String birthDateRaw) {
        String u = trim(username);
        String e = trim(email);
        String fn = trim(firstName);
        String ln = trim(lastName);
        String bd = trim(birthDateRaw);
        final LocalDate dateNaissance;
        if (bd.isEmpty()) {
            dateNaissance = null;
        } else {
            try {
                dateNaissance = LocalDate.parse(bd);
            } catch (DateTimeParseException ex) {
                throw new RuntimeException("Date de naissance invalide (AAAA-MM-JJ).");
            }
        }

        return patientRepository.findByUsername(u).orElseGet(() -> {
            if (patientRepository.existsByEmail(e)) {
                throw new RuntimeException("Cet email est déjà utilisé.");
            }
            Patient patient = Patient.builder()
                    .username(u)
                    .email(e)
                    .firstName(fn)
                    .lastName(ln)
                    .dateNaissance(dateNaissance)
                    .dateCreation(LocalDateTime.now())
                    .build();
            return patientRepository.save(patient);
        });
    }

    public Patient getByUsername(String username) {
        return patientRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Patient non trouvé pour l'utilisateur: " + username));
    }

    public java.util.Optional<Patient> findByIdPatient(Long idPatient) {
        return patientRepository.findById(idPatient);
    }

    public java.util.List<Patient> findAll() {
        return patientRepository.findAll();
    }
}
