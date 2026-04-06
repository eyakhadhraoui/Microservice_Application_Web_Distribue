package com.example.dossiermedicale.Controllers;

import com.example.dossiermedicale.Services.CalendrierService;
import com.example.dossiermedicale.dto.CalendrierEventDTO;
import com.example.dossiermedicale.util.BearerTokenPayloadReader;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Calendrier du patient : événements (suivis et images médicales) ajoutés par le médecin.
 */
@RestController
@RequestMapping("/api/calendrier")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CalendrierController {

    private static final Logger log = LoggerFactory.getLogger(CalendrierController.class);
    private final CalendrierService calendrierService;

    /** Événements du patient connecté (JWT → preferred_username). */
    @GetMapping("/mes-evenements")
    public ResponseEntity<?> getMesEvenements(HttpServletRequest request) {
        var usernameOpt = BearerTokenPayloadReader.preferredUsername(request);
        if (usernameOpt.isEmpty()) return ResponseEntity.status(401).build();
        String username = usernameOpt.get();
        if (username.isBlank()) return ResponseEntity.status(400).build();
        try {
            List<CalendrierEventDTO> events = calendrierService.getEvenementsPourPatient(username);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("Erreur calendrier mes-evenements pour username={}", username, e);
            String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            if (e.getCause() != null && e.getCause().getMessage() != null) {
                msg = msg + " | " + e.getCause().getMessage();
            }
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Internal Server Error",
                    "message", msg
            ));
        }
    }
}
