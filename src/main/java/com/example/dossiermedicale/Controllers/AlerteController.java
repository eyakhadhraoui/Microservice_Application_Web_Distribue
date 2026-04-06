package com.example.dossiermedicale.Controllers;

import com.example.dossiermedicale.Services.AlerteService;
import com.example.dossiermedicale.dto.AlerteDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alertes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AlerteController {

    private final AlerteService alerteService;

    /**
     * GET /api/alertes?jours=90&idMedecin=1
     * jours : seuil en jours sans suivi (optionnel, défaut depuis config)
     * idMedecin : filtrer par médecin (optionnel)
     */
    @GetMapping
    public ResponseEntity<List<AlerteDTO>> getAlertes(
            @RequestParam(required = false) Integer jours,
            @RequestParam(required = false) Long idMedecin) {
        List<AlerteDTO> list = alerteService.getAlertesSansSuivi(jours, idMedecin);
        return ResponseEntity.ok(list);
    }
}
