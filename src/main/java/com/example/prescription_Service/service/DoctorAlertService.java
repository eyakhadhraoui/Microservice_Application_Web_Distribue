package com.example.prescription_Service.service;

import com.example.prescription_Service.dto.DoctorAlertDTO;
import com.example.prescription_Service.entity.DoctorAlert;
import com.example.prescription_Service.entity.MedicationSchedule;
import com.example.prescription_Service.entity.Prescription;
import com.example.prescription_Service.entity.PrescriptionItem;
import com.example.prescription_Service.repository.DoctorAlertRepository;
import com.example.prescription_Service.repository.MedicationHistoryRepository;
import com.example.prescription_Service.repository.PrescriptionRepository;
import com.example.prescription_Service.repository.MedicationScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DoctorAlertService {

    private final DoctorAlertRepository    doctorAlertRepository;
    private final MedicationHistoryRepository medicationHistoryRepository;
    private final PrescriptionRepository   prescriptionRepository;
    private final MedicationScheduleRepository medicationSchedule;
    // ── toDTO ────────────────────────────────────────────────────
    private DoctorAlertDTO toDTO(DoctorAlert a) {
        return new DoctorAlertDTO(
                a.getId(), a.getPatientId(), a.getPrescriptionItemId(),
                a.getMedicationName(), a.getIsImmunosuppressor(),
                a.getAlertType(), a.getSeverity(), a.getMessage(),
                a.getMissedDaysCount(), a.getTriggeredAt(), a.getIsRead()
        );
    }

    // ── LECTURE ──────────────────────────────────────────────────

    // Toutes les alertes non lues (dashboard médecin)
    @Transactional(readOnly = true)
    public List<DoctorAlertDTO> getUnreadAlerts() {
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        return doctorAlertRepository
                .findRecentUnreadOrderedBySeverity(since)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // Alertes critiques seulement
    @Transactional(readOnly = true)
    public List<DoctorAlertDTO> getCriticalAlerts() {
        return doctorAlertRepository
                .findByIsImmunosuppressorTrueAndIsReadFalse()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // Compter alertes non lues (badge médecin)
    @Transactional(readOnly = true)
    public long countUnread() {
        return doctorAlertRepository.countByIsReadFalse();
    }

    // Compter alertes critiques non lues
    @Transactional(readOnly = true)
    public long countCritical() {
        return doctorAlertRepository.countByIsImmunosuppressorTrueAndIsReadFalse();
    }

    // Alertes immunosuppresseurs 7 derniers jours
    @Transactional(readOnly = true)
    public List<DoctorAlertDTO> getImmunoAlertsLastWeek() {
        return doctorAlertRepository
                .findImmunoAlertsLastWeek(LocalDateTime.now().minusDays(7))
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // Patients avec le plus d'alertes
    @Transactional(readOnly = true)
    public List<Object[]> getAlertSummaryByPatient() {
        return doctorAlertRepository.countUnreadGroupedByPatient();
    }

    // ── ACTIONS ──────────────────────────────────────────────────

    // Marquer une alerte comme lue
    public DoctorAlertDTO markAsRead(Long alertId) {
        DoctorAlert alert = doctorAlertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alerte non trouvée : " + alertId));
        alert.setIsRead(true);
        return toDTO(doctorAlertRepository.save(alert));
    }

    // Marquer toutes les alertes comme lues
    public void markAllAsRead() {
        List<DoctorAlert> unread = doctorAlertRepository.findByIsReadFalse();
        unread.forEach(a -> a.setIsRead(true));
        doctorAlertRepository.saveAll(unread);
    }

    // ── SCHEDULED — vérification quotidienne ─────────────────────
    @Scheduled(cron = "0 0 20 * * *")
    public void checkMissedDosesForToday() {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.atTime(LocalTime.MAX);
        LocalDateTime now = LocalDateTime.now();

        // ✅ Récupère TOUTES les prescriptions avec leurs items ET schedules
        List<Prescription> all = prescriptionRepository.findAllWithItemsAndSchedules();

        System.out.println("=== CHECK === Prescriptions: " + all.size());

        all.forEach(prescription -> {
            Long patientId = prescription.getPatientId();

            prescription.getPrescriptionItems().forEach(item -> {

                // ✅ CORRIGÉ
                List<MedicationSchedule> schedules =
                        medicationSchedule.findByPrescriptionItemId(item.getId());

                System.out.println("Item: " + item.getId() + " schedules: " + schedules.size());

                schedules.forEach(schedule -> {
                    LocalDateTime scheduledDateTime = today.atTime(schedule.getScheduledTime());
                    if (scheduledDateTime.isAfter(now)) return;

                    boolean taken = medicationHistoryRepository
                            .existsByPrescriptionItemIdAndTakenAtBetween(item.getId(), start, end);

                    if (!taken) {
                        boolean alreadyAlerted = doctorAlertRepository
                                .existsByPatientIdAndPrescriptionItemIdAndTriggeredAtBetween(
                                        patientId, item.getId(), start, end);

                        if (!alreadyAlerted) {
                            createMissedDoseAlert(patientId, item, schedule.getScheduledTime().toString());
                            System.out.println("✅ ALERTE créée: " + item.getMedication().getName());
                        }
                    }
                });
            });
        });
    }
    // Créer l'alerte dose manquée
    private void createMissedDoseAlert(Long patientId, PrescriptionItem item, String scheduledTime) {
        boolean isCritical = Boolean.TRUE.equals(item.getIsImmunosuppressor());

        // Compter jours consécutifs manqués
        int consecutiveDays = countConsecutiveMissedDays(patientId, item.getId());

        String alertType = consecutiveDays > 1 ? "CONSECUTIVE" : "MISSED_DOSE";
        String severity  = isCritical ? "CRITICAL" : "WARNING";
        String message   = buildMessage(item.getMedication().getName(),
                scheduledTime, consecutiveDays, isCritical);

        DoctorAlert alert = new DoctorAlert(
                patientId,
                item.getId(),
                item.getMedication().getName(),
                isCritical,
                alertType,
                severity,
                message,
                consecutiveDays,
                LocalDateTime.now()
        );

        doctorAlertRepository.save(alert);
    }

    // Compter jours consécutifs sans prise
    private int countConsecutiveMissedDays(Long patientId, Long prescriptionItemId) {
        int count = 0;
        LocalDate day = LocalDate.now();

        for (int i = 0; i < 30; i++) { // max 30 jours en arrière
            LocalDateTime start = day.atStartOfDay();
            LocalDateTime end   = day.atTime(LocalTime.MAX);

            boolean taken = medicationHistoryRepository
                    .existsByPrescriptionItemIdAndTakenAtBetween(prescriptionItemId, start, end);

            if (!taken) {
                count++;
                day = day.minusDays(1);
            } else {
                break;
            }
        }
        return count;
    }

    // Construire le message d'alerte
    private String buildMessage(String medName, String time, int days, boolean isCritical) {
        StringBuilder sb = new StringBuilder();
        if (isCritical) sb.append("🚨 CRITIQUE — ");
        else            sb.append("⚠️ ");

        sb.append(medName).append(" non pris à ").append(time);

        if (days > 1) {
            sb.append(" — ").append(days).append(" jour(s) consécutif(s) manqués");
        }

        if (isCritical) {
            sb.append(". Immunosuppresseur — risque de rejet !");
        }

        return sb.toString();
    }
}

