package com.example.prescription_Service.service;

import com.example.prescription_Service.dto.DosageAdjustmentDTO;
import com.example.prescription_Service.entity.*;
import com.example.prescription_Service.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DosageAdjustmentService {

    private final DosageAdjustmentRepository adjustmentRepository;
    private final PatientWeightRepository    weightRepository;
    private final PrescriptionRepository     prescriptionRepository;

    // Tacrolimus pédiatrique : 0.1 mg/kg/jour
    private static final double TACROLIMUS_DOSE_PER_KG = 0.1;
    // Seuil de déclenchement : changement de poids > 10%
    private static final double THRESHOLD_PERCENT = 0.10;

    // ══════════════════════════════════════════════════════
    // toDTO
    // ══════════════════════════════════════════════════════
    private DosageAdjustmentDTO toDTO(DosageAdjustment d) {
        double pct = 0;
        if (d.getCurrentDose() != null && d.getCurrentDose() > 0) {
            pct = (d.getSuggestedDose() - d.getCurrentDose()) / d.getCurrentDose() * 100;
        }
        String medName = (d.getPrescriptionItem() != null)
                ? d.getPrescriptionItem().getMedication().getName() : "?";
        Long itemId = (d.getPrescriptionItem() != null)
                ? d.getPrescriptionItem().getId() : null;

        return new DosageAdjustmentDTO(
                d.getId(), itemId, medName,
                d.getPatientId(),
                d.getCurrentDose(), d.getSuggestedDose(),
                d.getWeightUsed(), d.getPreviousWeight(),
                Math.round(pct * 10.0) / 10.0,
                d.getReason(), d.getStatus(),
                d.getCreatedAt(), d.getReviewedAt(), d.getReviewedBy()
        );
    }

    // ══════════════════════════════════════════════════════
    // LECTURE
    // ══════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<DosageAdjustmentDTO> getPendingAdjustments() {
        return adjustmentRepository.findPendingOrderedByUrgency()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long countPending() {
        return adjustmentRepository.countByStatus("PENDING");
    }

    // ══════════════════════════════════════════════════════
    // SAISIE POIDS → CALCUL AUTOMATIQUE
    // ══════════════════════════════════════════════════════

    public void recordWeight(Long patientId, Double newWeightKg) {

        System.out.println("=== POIDS REÇU === Patient: " + patientId + " | Poids: " + newWeightKg + " kg");

        // 1. Sauvegarde le nouveau poids
        PatientWeight newWeight = new PatientWeight(patientId, newWeightKg, LocalDateTime.now());
        weightRepository.save(newWeight);
        System.out.println("✅ Poids sauvegardé en base");

        // 2. Récupère les 2 derniers poids
        List<PatientWeight> lastTwo = weightRepository.findLastTwoWeights(patientId);
        System.out.println("📊 Historique poids trouvé: " + lastTwo.size() + " mesure(s)");

        if (lastTwo.size() < 2) {
            System.out.println("ℹ️ Premier poids enregistré — pas de comparaison possible");
            return;
        }

        // 3. Compare avec le poids précédent
        Double previousWeightKg = lastTwo.get(1).getWeightKg();
        double change = Math.abs(newWeightKg - previousWeightKg) / previousWeightKg;
        System.out.println("📈 Poids précédent: " + previousWeightKg + " kg");
        System.out.println("📈 Changement: " + Math.round(change * 100) + "%");

        // 4. Si > 10% → calcule les nouvelles doses
        if (change > THRESHOLD_PERCENT) {
            System.out.println("⚠️ Changement > 10% → Calcul ajustement doses...");
            checkAndCreateAdjustments(patientId, newWeightKg, previousWeightKg);
        } else {
            System.out.println("✅ Changement < 10% → Pas d'ajustement nécessaire");
        }
    }

    // ══════════════════════════════════════════════════════
    // CALCUL DOSE SUGGÉRÉE
    // ══════════════════════════════════════════════════════

    private void checkAndCreateAdjustments(Long patientId,
                                           Double newWeight,
                                           Double previousWeight) {

        List<Prescription> all = prescriptionRepository.findAllWithItemsAndSchedules();
        System.out.println("📋 Prescriptions chargées: " + all.size());

        all.stream()
                .filter(p -> p.getPatientId().equals(patientId))
                .forEach(prescription ->
                        prescription.getPrescriptionItems().forEach(item -> {

                            // Seulement les immunosuppresseurs
                            if (!Boolean.TRUE.equals(item.getIsImmunosuppressor())) {
                                System.out.println("  ⏭ " + item.getMedication().getName() + " — pas immunosuppresseur, ignoré");
                                return;
                            }

                            // Anti-doublon : pas 2 PENDING pour le même item
                            if (adjustmentRepository.existsByPrescriptionItemIdAndStatus(
                                    item.getId(), "PENDING")) {
                                System.out.println("  ⚠️ Déjà un ajustement PENDING pour: " + item.getMedication().getName());
                                return;
                            }

                            // Dose actuelle
                            double currentDose = extractDoseValue(item.getDosageInstructions());

                            // Dose suggérée : poids × 0.1 mg/kg
                            double suggestedDose = Math.round(newWeight * TACROLIMUS_DOSE_PER_KG * 10.0) / 10.0;

                            String reason = String.format(
                                    "Poids changé: %.1f kg → %.1f kg (+%.0f%%)",
                                    previousWeight, newWeight,
                                    (newWeight - previousWeight) / previousWeight * 100
                            );

                            DosageAdjustment adj = new DosageAdjustment(
                                    item, patientId,
                                    currentDose, suggestedDose,
                                    newWeight, previousWeight, reason
                            );
                            adjustmentRepository.save(adj);

                            System.out.println("  ✅ AJUSTEMENT CRÉÉ: " + item.getMedication().getName()
                                    + " | Dose actuelle: " + currentDose + "mg"
                                    + " → Dose suggérée: " + suggestedDose + "mg"
                                    + " | Raison: " + reason);
                        })
                );
    }

    // Extrait la valeur numérique de dosageInstructions
    // ex: "0.1 mg 2x/jour" → 0.1 | ex: "2.2" → 2.2
    private double extractDoseValue(String instructions) {
        if (instructions == null) return 0.0;
        try {
            String[] parts = instructions.trim().split("\\s+");
            return Double.parseDouble(parts[0]);
        } catch (Exception e) {
            System.out.println("⚠️ Impossible d'extraire la dose de: " + instructions);
            return 0.0;
        }
    }

    // ══════════════════════════════════════════════════════
    // VALIDATION MÉDECIN
    // ══════════════════════════════════════════════════════

    // Médecin APPROUVE → met à jour PrescriptionItem
    public DosageAdjustmentDTO approve(Long adjustmentId, String doctorName) {
        DosageAdjustment adj = adjustmentRepository.findById(adjustmentId)
                .orElseThrow(() -> new RuntimeException("Ajustement non trouvé: " + adjustmentId));

        // Met à jour dosageInstructions dans PrescriptionItem
        PrescriptionItem item = adj.getPrescriptionItem();
        String oldInstr = item.getDosageInstructions();
        String newInstr = oldInstr.replaceFirst("^[0-9.]+", String.valueOf(adj.getSuggestedDose()));
        item.setDosageInstructions(newInstr);

        adj.setStatus("APPROVED");
        adj.setReviewedAt(LocalDateTime.now());
        adj.setReviewedBy(doctorName);

        System.out.println("✅ APPROUVÉ par " + doctorName
                + " | " + item.getMedication().getName()
                + " | " + adj.getCurrentDose() + "mg → " + adj.getSuggestedDose() + "mg");

        return toDTO(adjustmentRepository.save(adj));
    }

    // Médecin REFUSE
    public DosageAdjustmentDTO reject(Long adjustmentId, String doctorName) {
        DosageAdjustment adj = adjustmentRepository.findById(adjustmentId)
                .orElseThrow(() -> new RuntimeException("Ajustement non trouvé: " + adjustmentId));

        adj.setStatus("REJECTED");
        adj.setReviewedAt(LocalDateTime.now());
        adj.setReviewedBy(doctorName);

        System.out.println("❌ REFUSÉ par " + doctorName
                + " | " + adj.getPrescriptionItem().getMedication().getName());

        return toDTO(adjustmentRepository.save(adj));
    }

    // ══════════════════════════════════════════════════════
    // SCHEDULED — vérification chaque lundi matin à 8h
    // ══════════════════════════════════════════════════════
    @Scheduled(cron = "0 0 8 * * MON")
    public void weeklyWeightCheck() {
        System.out.println("=== VÉRIFICATION POIDS HEBDOMADAIRE ===");
        List<Long> patients = weightRepository.findAllPatientsWithWeightHistory();
        System.out.println("Patients avec historique poids: " + patients.size());

        patients.forEach(patientId -> {
            List<PatientWeight> lastTwo = weightRepository.findLastTwoWeights(patientId);
            if (lastTwo.size() >= 2) {
                double newW  = lastTwo.get(0).getWeightKg();
                double prevW = lastTwo.get(1).getWeightKg();
                double change = Math.abs(newW - prevW) / prevW;
                if (change > THRESHOLD_PERCENT) {
                    checkAndCreateAdjustments(patientId, newW, prevW);
                }
            }
        });
    }
}