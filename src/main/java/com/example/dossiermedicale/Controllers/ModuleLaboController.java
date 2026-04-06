package com.example.dossiermedicale.Controllers;

import com.example.dossiermedicale.Enum.SexeNorme;
import com.example.dossiermedicale.Services.ModuleLaboService;
import com.example.dossiermedicale.dto.ResultatLabtestDTO;
import com.example.dossiermedicale.Services.ResultatLabtestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Endpoints utilitaires module labo : interprétation automatique, formule de Schwartz (DFG).
 */
@RestController
@RequestMapping("/api/module-labo")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ModuleLaboController {

    private final ModuleLaboService moduleLaboService;
    private final ResultatLabtestService resultatLabtestService;

    /** Relance l'interprétation automatique d'un résultat (normes âge/sexe). */
    @PostMapping("/interpreter/{resultatId}")
    public ResponseEntity<ResultatLabtestDTO> interpreter(
            @PathVariable Long resultatId,
            @RequestParam int ageMois,
            @RequestParam SexeNorme sexe) {
        moduleLaboService.interpreterAutomatique(resultatId, ageMois, sexe);
        return ResponseEntity.ok(resultatLabtestService.getById(resultatId));
    }

    /** Calcule le DFG estimé (formule de Schwartz) : taille (cm), créatinine (µmol/L), âge (mois), garçon (true/false). */
    @GetMapping("/dfg-estime")
    public ResponseEntity<Map<String, Object>> dfgEstime(
            @RequestParam BigDecimal tailleCm,
            @RequestParam BigDecimal creatinineUmolL,
            @RequestParam int ageMois,
            @RequestParam(defaultValue = "true") boolean garcon) {
        BigDecimal dfg = moduleLaboService.calculerDFGEstime(tailleCm, creatinineUmolL, ageMois, garcon);
        return ResponseEntity.ok(Map.of("dfgEstime", dfg != null ? dfg : "N/A", "unite", "mL/min/1.73m²"));
    }
}
