package com.example.dossiermedicale.Controllers;

import com.example.dossiermedicale.Enum.SexeNorme;
import com.example.dossiermedicale.Services.ResultatLabtestService;
import com.example.dossiermedicale.dto.ResultatLabtestDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resultats-labtest")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ResultatLabtestController {

    private final ResultatLabtestService resultatLabtestService;

    /** Crée un résultat ; interprétation auto si âge/sexe fournis ou déduits du dossier. */
    @PostMapping
    public ResponseEntity<ResultatLabtestDTO> create(
            @RequestBody ResultatLabtestDTO dto,
            @RequestParam(required = false) Integer ageMois,
            @RequestParam(required = false) SexeNorme sexe) {
        ResultatLabtestDTO created = (ageMois != null && sexe != null)
                ? resultatLabtestService.create(dto, ageMois, sexe)
                : resultatLabtestService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/valider/{resultatId}")
    public ResponseEntity<ResultatLabtestDTO> valider(@PathVariable Long resultatId, @RequestParam Long medecinId) {
        return ResponseEntity.ok(resultatLabtestService.validerParMedecin(resultatId, medecinId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResultatLabtestDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(resultatLabtestService.getById(id));
    }

    @GetMapping("/prescription/{prescriptionId}")
    public ResponseEntity<List<ResultatLabtestDTO>> getByPrescription(@PathVariable Long prescriptionId) {
        return ResponseEntity.ok(resultatLabtestService.getByPrescription(prescriptionId));
    }

    @GetMapping("/dossier/{dossierId}")
    public ResponseEntity<List<ResultatLabtestDTO>> getByDossier(@PathVariable Long dossierId) {
        return ResponseEntity.ok(resultatLabtestService.getByDossier(dossierId));
    }
}
