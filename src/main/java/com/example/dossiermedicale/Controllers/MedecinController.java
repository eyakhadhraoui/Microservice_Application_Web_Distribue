package com.example.dossiermedicale.Controllers;

import com.example.dossiermedicale.Services.MedecinService;
import com.example.dossiermedicale.dto.MedecinDTO;
import com.example.dossiermedicale.util.BearerTokenPayloadReader;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/medecins")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class MedecinController {

    private static final Logger log = LoggerFactory.getLogger(MedecinController.class);
    private final MedecinService medecinService;

    /** Médecin connecté (JWT → preferred_username). Crée le médecin en base si besoin. */
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
            MedecinDTO dto = medecinService.findOrCreateByUsername(username);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur /api/medecins/me pour username={}", username, e);
            String msg = e.getMessage() != null ? e.getMessage() : "Erreur serveur";
            return ResponseEntity.status(500).body(Map.of("message", msg));
        }
    }
}
