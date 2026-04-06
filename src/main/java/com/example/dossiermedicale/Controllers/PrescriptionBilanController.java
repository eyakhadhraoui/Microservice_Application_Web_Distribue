package com.example.dossiermedicale.Controllers;

import com.example.dossiermedicale.Services.PrescriptionBilanService;
import com.example.dossiermedicale.dto.PrescriptionBilanDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions-bilan")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PrescriptionBilanController {

    private final PrescriptionBilanService prescriptionBilanService;

    @PostMapping
    public ResponseEntity<PrescriptionBilanDTO> create(@Valid @RequestBody PrescriptionBilanDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(prescriptionBilanService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PrescriptionBilanDTO> update(@PathVariable Long id, @Valid @RequestBody PrescriptionBilanDTO dto) {
        return ResponseEntity.ok(prescriptionBilanService.update(id, dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PrescriptionBilanDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(prescriptionBilanService.getById(id));
    }

    @GetMapping("/dossier/{dossierId}")
    public ResponseEntity<List<PrescriptionBilanDTO>> getByDossier(@PathVariable Long dossierId) {
        return ResponseEntity.ok(prescriptionBilanService.getByDossier(dossierId));
    }

    @GetMapping("/medecin/{medecinId}")
    public ResponseEntity<List<PrescriptionBilanDTO>> getByMedecin(@PathVariable Long medecinId) {
        return ResponseEntity.ok(prescriptionBilanService.getByMedecin(medecinId));
    }
}
