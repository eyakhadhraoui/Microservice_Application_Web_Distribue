package com.example.dossiermedicale.Controllers;

import com.example.dossiermedicale.Services.NotificationMedecinService;
import com.example.dossiermedicale.dto.NotificationMedecinDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Contrôleur des alertes/notifications pour le médecin.
 * Inclut les alertes "médicament non pris" (observance).
 */
@RestController
@RequestMapping("/api/notifications-medecin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationMedecinController {

    private final NotificationMedecinService notificationMedecinService;

    /** Liste toutes les notifications du médecin (pour le dashboard). */
    @GetMapping("/medecin/{idMedecin}")
    public ResponseEntity<List<NotificationMedecinDTO>> getByMedecin(@PathVariable Long idMedecin) {
        return ResponseEntity.ok(notificationMedecinService.getByMedecin(idMedecin));
    }

    /** Uniquement les non lues (ex: badge). */
    @GetMapping("/medecin/{idMedecin}/non-lues")
    public ResponseEntity<List<NotificationMedecinDTO>> getNonLues(@PathVariable Long idMedecin) {
        return ResponseEntity.ok(notificationMedecinService.getNonLuesByMedecin(idMedecin));
    }

    /** Nombre de notifications non lues (pour badge). */
    @GetMapping("/medecin/{idMedecin}/count-non-lues")
    public ResponseEntity<Map<String, Long>> countNonLues(@PathVariable Long idMedecin) {
        long count = notificationMedecinService.countNonLuesByMedecin(idMedecin);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PatchMapping("/{id}/lu")
    public ResponseEntity<Void> marquerCommeLu(@PathVariable Long id) {
        notificationMedecinService.marquerCommeLu(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/medecin/{idMedecin}/toutes-lues")
    public ResponseEntity<Void> marquerToutesCommeLues(@PathVariable Long idMedecin) {
        notificationMedecinService.marquerToutesCommeLues(idMedecin);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/notifications-medecin/medicament-non-pris
     * Crée une alerte quand un patient n'a pas pris son médicament.
     * Appelé par le service prescription (8086) ou un job planifié.
     */
    @PostMapping("/medicament-non-pris")
    public ResponseEntity<NotificationMedecinDTO> creerAlerteMedicamentNonPris(
            @RequestBody MedicamentNonPrisRequest request) {
        notificationMedecinService.creerPourMedicamentNonPris(
                request.getIdMedecin(),
                request.getIdDossierMedical(),
                request.getIdPatient(),
                request.getNomPatient(),
                request.getNomMedicament(),
                request.getDatePrise());
        return ResponseEntity.accepted().build();
    }

    /** Requête pour créer une alerte "médicament non pris". */
    @lombok.Data
    public static class MedicamentNonPrisRequest {
        private Long idMedecin;
        private Long idDossierMedical;
        private Long idPatient;
        private String nomPatient;
        private String nomMedicament;
        private String datePrise;
    }
}
