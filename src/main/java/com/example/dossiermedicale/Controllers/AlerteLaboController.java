package com.example.dossiermedicale.Controllers;

import com.example.dossiermedicale.Services.AlerteLaboService;
import com.example.dossiermedicale.dto.AlerteLaboDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alertes-labo")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AlerteLaboController {

    private final AlerteLaboService alerteLaboService;

    @GetMapping("/resultat/{resultatId}")
    public ResponseEntity<List<AlerteLaboDTO>> getByResultat(@PathVariable Long resultatId) {
        return ResponseEntity.ok(alerteLaboService.getByResultat(resultatId));
    }

    @GetMapping("/non-acquittees")
    public ResponseEntity<List<AlerteLaboDTO>> getNonAcquittees() {
        return ResponseEntity.ok(alerteLaboService.getNonAcquittees());
    }

    @PostMapping("/{alerteId}/acquitter")
    public ResponseEntity<Void> acquitter(
            @PathVariable Long alerteId,
            @RequestBody Map<String, Object> body) {
        Long medecinId = body.get("medecinId") != null ? Long.valueOf(body.get("medecinId").toString()) : null;
        String action = body.get("actionRealisee") != null ? body.get("actionRealisee").toString() : null;
        alerteLaboService.acquitter(alerteId, medecinId, action);
        return ResponseEntity.ok().build();
    }
}
