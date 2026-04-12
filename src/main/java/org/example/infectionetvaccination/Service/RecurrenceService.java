package org.example.infectionetvaccination.Service;


import org.example.infectionetvaccination.DTO.RecurrenceRecord;
import org.example.infectionetvaccination.Entity.Infection;
import org.example.infectionetvaccination.Entity.Vaccination;
import org.example.infectionetvaccination.Repository.InfectionRepository;
import org.example.infectionetvaccination.Repository.VaccinationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.Temporal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecurrenceService {

    private final InfectionRepository infectionRepo;
    private final VaccinationRepository vaccinationRepo;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH);

    public RecurrenceService(InfectionRepository infectionRepo,
                             VaccinationRepository vaccinationRepo) {
        this.infectionRepo   = infectionRepo;
        this.vaccinationRepo = vaccinationRepo;
    }

    // ── Public API ──────────────────────────────────────────────────────────

    /** All recurring infections across every patient (medecin view). */
    public List<RecurrenceRecord> getAllRecurrences() {
        return buildRecurrences(infectionRepo.findAll(), null);
    }

    private List<RecurrenceRecord> buildRecurrences(List<Infection> all, Object patientFilter) {
        return List.of();
    }

    /** Recurring infections scoped to a single patient (patient view). */
    public List<RecurrenceRecord> getRecurrencesForPatient(String username) {
        List<Infection> scope = infectionRepo.findByPatientNameIgnoreCase(username);
        return buildRecurrences(scope, username);
    }

    // ── Core logic ──────────────────────────────────────────────────────────

    private List<RecurrenceRecord> buildRecurrences(List<Infection> infections,
                                                    String patientFilter) {
        return null;
    }

    private void buildPrediction(RecurrenceRecord rec,
                                 List<Infection> sorted,
                                 List<Vaccination> vaccinations) {
        int count    = sorted.size();
        long avgDays = avgDaysBetween(sorted);
        List<String> reasons = new ArrayList<>();

        // Base probability
        double chance = Math.min(25 + (count - 1) * 18.0, 88);
        reasons.add(count + " episodes → base probability " + (int) chance + "%.");

        // Frequency modifier
        if (avgDays > 0 && avgDays <= 30) {
            chance = Math.min(chance + 12, 95);
            reasons.add("Very frequent (avg " + avgDays + "d) — +12%.");
        } else if (avgDays > 30 && avgDays <= 90) {
            chance = Math.min(chance + 6, 95);
            reasons.add("Moderate frequency (avg " + avgDays + "d) — +6%.");
        } else if (avgDays > 180) {
            chance = Math.max(chance - 10, 10);
            reasons.add("Episodes far apart (avg " + avgDays + "d) — -10%.");
        } else if (avgDays > 0) {
            reasons.add("Average interval: " + avgDays + " days.");
        }

        // Severity trend
        List<String> sevOrder = List.of(
                "Asymptomatic", "Mild", "Moderate", "Severe", "Critical");
        int firstSev = sevOrder.indexOf(sorted.get(0).getSeverity());
        int lastSev  = sevOrder.indexOf(sorted.get(sorted.size() - 1).getSeverity());
        if (lastSev > firstSev) {
            chance = Math.min(chance + 8, 95);
            reasons.add("Severity escalating — +8%.");
        } else if (lastSev < firstSev) {
            chance = Math.max(chance - 6, 10);
            reasons.add("Severity improving — -6%.");
        }

        // Vaccination modifier
        Set<Object> infIds = sorted.stream()
                .map(Infection::getId).collect(Collectors.toSet());

        Optional<Vaccination> linkedVac = vaccinations.stream()
                .filter(v -> v.getInfectionId() != null && infIds.contains(v.getInfectionId()))
                .findFirst();

        if (linkedVac.isPresent()) {
            Vaccination vac = linkedVac.get();
            if (Boolean.TRUE.equals(vac.isTaken())) {
                long daysAgo = ChronoUnit.DAYS.between(vac.getVaccinationDate(), LocalDate.now());
                int cut = daysAgo <= 180 ? 30 : 15;
                chance = Math.max(chance - cut, 5);
                reasons.add("Vaccination taken " + daysAgo + "d ago — -" + cut + "%.");
                if (Boolean.TRUE.equals(vac.isBoosterTaken())) {
                    chance = Math.max(chance - 10, 5);
                    reasons.add("Booster taken — -10%.");
                }
            } else {
                chance = Math.min(chance + 10, 95);
                reasons.add("Linked vaccination not yet taken — +10%.");
            }
        } else {
            chance = Math.min(chance + 8, 95);
            reasons.add("No linked vaccination — +8%.");
        }

        // Prediction window
        long variance = Math.max(Math.round((avgDays > 0 ? avgDays : 90) * 0.22), 7);
        Date lastDate = sorted.get(sorted.size() - 1).getDetectionDate();
        LocalDate mid   = LocalDate.ofEpochDay(lastDate.getDay());
        LocalDate early = mid.minusDays(variance);
        LocalDate late  = mid.plusDays(variance);
        reasons.add("Window: last episode + avg interval ± " + variance + "d.");

        // Risk label
        String label;
        if (chance >= 70)      label = "High";
        else if (chance >= 45) label = "Moderate";
        else                   label = "Low";

        rec.setChance(Math.round(chance));
        rec.setEarliest(early.format(FMT));
        rec.setLatest(late.format(FMT));
        rec.setRiskLabel(label);
        rec.setReasons(reasons);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private long avgDaysBetween(List<Infection> sorted) {
        if (sorted.size() < 2) return 0;
        long total = 0;
        for (int i = 1; i < sorted.size(); i++)
            total += ChronoUnit.DAYS.between(
                    (Temporal) sorted.get(i - 1).getDetectionDate(),
                    (Temporal) sorted.get(i).getDetectionDate());
        return Math.round((double) total / (sorted.size() - 1));
    }
}
