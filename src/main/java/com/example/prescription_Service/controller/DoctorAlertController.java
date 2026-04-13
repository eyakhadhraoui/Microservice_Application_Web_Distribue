package com.example.prescription_Service.controller;

import com.example.prescription_Service.dto.DoctorAlertDTO;
import com.example.prescription_Service.service.DoctorAlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctor-alerts")
@RequiredArgsConstructor
public class DoctorAlertController {

    private final DoctorAlertService doctorAlertService;

    // GET /api/doctor-alerts — toutes les alertes non lues (dashboard médecin)
    @GetMapping
    public ResponseEntity<List<DoctorAlertDTO>> getUnreadAlerts() {
        return ResponseEntity.ok(doctorAlertService.getUnreadAlerts());
    }

    // GET /api/doctor-alerts/critical — immunosuppresseurs uniquement
    @GetMapping("/critical")
    public ResponseEntity<List<DoctorAlertDTO>> getCriticalAlerts() {
        return ResponseEntity.ok(doctorAlertService.getCriticalAlerts());
    }

    // GET /api/doctor-alerts/count — badge nombre d'alertes
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getCount() {
        return ResponseEntity.ok(Map.of(
                "total",    doctorAlertService.countUnread(),
                "critical", doctorAlertService.countCritical()
        ));
    }

    // GET /api/doctor-alerts/immuno-week — immunosuppresseurs 7 derniers jours
    @GetMapping("/immuno-week")
    public ResponseEntity<List<DoctorAlertDTO>> getImmunoLastWeek() {
        return ResponseEntity.ok(doctorAlertService.getImmunoAlertsLastWeek());
    }

    // GET /api/doctor-alerts/summary — résumé par patient
    @GetMapping("/summary")
    public ResponseEntity<List<Object[]>> getSummaryByPatient() {
        return ResponseEntity.ok(doctorAlertService.getAlertSummaryByPatient());
    }

    // PUT /api/doctor-alerts/{id}/read — marquer une alerte lue
    @PutMapping("/{id}/read")
    public ResponseEntity<DoctorAlertDTO> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(doctorAlertService.markAsRead(id));
    }

    // PUT /api/doctor-alerts/read-all — marquer toutes lues
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        doctorAlertService.markAllAsRead();
        return ResponseEntity.noContent().build();
    }

    // POST /api/doctor-alerts/check-now — déclencher vérification manuelle (test)
    @PostMapping("/check-now")
    public ResponseEntity<Map<String, String>> checkNow() {
        doctorAlertService.checkMissedDosesForToday();
        return ResponseEntity.ok(Map.of("status", "Vérification effectuée"));
    }
}




















