package com.example.dossiermedicale.Controllers;

import com.example.dossiermedicale.Entities.Patient;
import com.example.dossiermedicale.Services.PatientService;
import com.example.dossiermedicale.util.BearerTokenPayloadReader;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class PatientController {

    private final PatientService patientService;

    /**
     * Synchronisation profil patient après inscription Keycloak (appelé par le user-service Symfony via Gateway).
     */
    @PostMapping("/register-profile")
    public ResponseEntity<?> registerProfile(@RequestBody Map<String, String> body) {
        String username = body.getOrDefault("username", "").trim();
        String email = body.getOrDefault("email", "").trim();
        String firstName = body.getOrDefault("firstName", "").trim();
        String lastName = body.getOrDefault("lastName", "").trim();
        String birthDate = body.getOrDefault("birthDate", "").trim();
        if (username.isBlank() || email.isBlank() || firstName.isBlank() || lastName.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Champs requis: username, email, firstName, lastName"));
        }
        try {
            Patient p = patientService.ensureProfileFromRegistration(username, email, firstName, lastName, birthDate);
            return ResponseEntity.status(201).body(Map.of(
                    "idPatient", p.getIdPatient(),
                    "username", p.getUsername()
            ));
        } catch (RuntimeException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "Erreur";
            int status = msg.contains("déjà") ? 409 : 400;
            return ResponseEntity.status(status).body(Map.of("message", msg));
        }
    }

    /** Liste tous les patients (back office : médecin choisit le n° patient pour créer un dossier). */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listAll() {
        List<Patient> patients = patientService.findAll();
        List<Map<String, Object>> list = patients.stream()
                .map(p -> Map.<String, Object>of(
                        "idPatient", p.getIdPatient(),
                        "username", p.getUsername() != null ? p.getUsername() : "",
                        "firstName", p.getFirstName() != null ? p.getFirstName() : "",
                        "lastName", p.getLastName() != null ? p.getLastName() : ""
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    /** Profil du patient connecté (JWT → preferred_username). */
    @GetMapping("/me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        var usernameOpt = BearerTokenPayloadReader.preferredUsername(request);
        if (usernameOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Non authentifié"));
        }
        String username = usernameOpt.get();
        if (username.isBlank()) {
            return ResponseEntity.status(400).body(Map.of("message", "Username absent du token"));
        }
        try {
            Patient patient = patientService.getByUsername(username);
            return ResponseEntity.ok(Map.of(
                    "idPatient", patient.getIdPatient(),
                    "username", patient.getUsername(),
                    "email", patient.getEmail() != null ? patient.getEmail() : "",
                    "firstName", patient.getFirstName(),
                    "lastName", patient.getLastName()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }
}
