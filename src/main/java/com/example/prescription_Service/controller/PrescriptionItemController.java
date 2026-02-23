package com.example.prescription_Service.controller;

import com.example.prescription_Service.dto.PrescriptionItemDTO;
import com.example.prescription_Service.service.PrescriptionItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/prescription-items")
@RequiredArgsConstructor
public class PrescriptionItemController {

    private final PrescriptionItemService prescriptionItemService;

    // Créer un item
    @PostMapping
    public ResponseEntity<PrescriptionItemDTO> create(@Valid @RequestBody PrescriptionItemDTO prescriptionItemDTO) {
        PrescriptionItemDTO created = prescriptionItemService.createPrescriptionItem(prescriptionItemDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // Récupérer tous les items
    @GetMapping
    public ResponseEntity<List<PrescriptionItemDTO>> getAll() {
        List<PrescriptionItemDTO> items = prescriptionItemService.getAllPrescriptionItems();
        return ResponseEntity.ok(items);
    }

    // Récupérer un item par ID
    @GetMapping("/{id}")
    public ResponseEntity<PrescriptionItemDTO> getById(@PathVariable Long id) {
        PrescriptionItemDTO item = prescriptionItemService.getPrescriptionItemById(id);
        return ResponseEntity.ok(item);
    }

    // Récupérer les items d'une prescription
    @GetMapping("/prescription/{prescriptionId}")
    public ResponseEntity<List<PrescriptionItemDTO>> getByPrescriptionId(@PathVariable Long prescriptionId) {
        List<PrescriptionItemDTO> items = prescriptionItemService.getByPrescriptionId(prescriptionId);
        return ResponseEntity.ok(items);
    }

    // Récupérer les items d'un médicament
    @GetMapping("/medication/{medicationId}")
    public ResponseEntity<List<PrescriptionItemDTO>> getByMedicationId(@PathVariable Long medicationId) {
        List<PrescriptionItemDTO> items = prescriptionItemService.getByMedicationId(medicationId);
        return ResponseEntity.ok(items);
    }

    // Récupérer les items prioritaires
    @GetMapping("/prescription/{prescriptionId}/priority")
    public ResponseEntity<List<PrescriptionItemDTO>> getPriorityItems(@PathVariable Long prescriptionId) {
        List<PrescriptionItemDTO> items = prescriptionItemService.getPriorityItems(prescriptionId);
        return ResponseEntity.ok(items);
    }

    // Récupérer les items actifs à une date
    @GetMapping("/active")
    public ResponseEntity<List<PrescriptionItemDTO>> getActiveItems(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<PrescriptionItemDTO> items = prescriptionItemService.getActiveItemsOnDate(date);
        return ResponseEntity.ok(items);
    }

    // Mettre à jour un item
    @PutMapping("/{id}")
    public ResponseEntity<PrescriptionItemDTO> update(@PathVariable Long id,
                                                      @Valid @RequestBody PrescriptionItemDTO prescriptionItemDTO) {
        PrescriptionItemDTO updated = prescriptionItemService.updatePrescriptionItem(id, prescriptionItemDTO);
        return ResponseEntity.ok(updated);
    }

    // Supprimer un item
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        prescriptionItemService.deletePrescriptionItem(id);
        return ResponseEntity.noContent().build();
    }
    // Ajouter dans PrescriptionItemController
    @GetMapping("/prescription/{prescriptionId}/immunosuppresseurs")
    public ResponseEntity<List<PrescriptionItemDTO>> getImmunosuppresseurs(@PathVariable Long prescriptionId) {
        return ResponseEntity.ok(prescriptionItemService.getImmunosuppresseurs(prescriptionId));
    }

}