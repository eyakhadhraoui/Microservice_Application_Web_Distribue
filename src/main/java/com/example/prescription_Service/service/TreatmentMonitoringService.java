package com.example.prescription_Service.service;

import com.example.prescription_Service.entity.PrescriptionItem;
import com.example.prescription_Service.repository.MedicationHistoryRepository;
import com.example.prescription_Service.repository.PrescriptionItemRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
public class TreatmentMonitoringService {

    private final MedicationHistoryRepository historyRepository;
    private final PrescriptionItemRepository itemRepository;

    public TreatmentMonitoringService(
            MedicationHistoryRepository historyRepository,
            PrescriptionItemRepository itemRepository) {

        this.historyRepository = historyRepository;
        this.itemRepository = itemRepository;
    }

    // 1️⃣ Nombre total doses prévues
    public int calculateExpectedDoses(PrescriptionItem item) {

        long days = ChronoUnit.DAYS.between(
                item.getStartDate(),
                item.getEndDate()
        ) + 1;

        int dosesPerDay = item.getSchedules().size();

        return (int) days * dosesPerDay;
    }

    // 2️⃣ Doses prises
    public int countTakenDoses(Long itemId) {
        return historyRepository
                .countByPrescriptionItemIdAndStatus(itemId, "TAKEN");
    }

    // 3️⃣ Jours oubliés
    public int countMissedDays(PrescriptionItem item) {

        int missedDays = 0;
        LocalDate current = item.getStartDate();

        while (!current.isAfter(item.getEndDate())) {

            boolean taken =
                    historyRepository.existsByPrescriptionItemIdAndTakenAtBetween(
                            item.getId(),
                            current.atStartOfDay(),
                            current.atTime(23,59)
                    );

            if (!taken) missedDays++;

            current = current.plusDays(1);
        }

        return missedDays;
    }

    // 4️⃣ Score conformité %
    public double calculateComplianceRate(PrescriptionItem item) {

        int expected = calculateExpectedDoses(item);
        int taken = countTakenDoses(item.getId());

        if(expected == 0) return 0;

        return (double) taken / expected * 100;
    }

    // 5️⃣ Niveau de risque
    public String calculateRiskLevel(double rate) {

        if(rate >= 90) return "LOW";
        if(rate >= 70) return "MODERATE";
        if(rate >= 50) return "HIGH";
        return "CRITICAL";
    }

    public MonitoringResponse getMonitoringData(Long itemId) {

        PrescriptionItem item = itemRepository.findById(itemId).orElseThrow();

        int expected = calculateExpectedDoses(item);
        int taken = countTakenDoses(itemId);
        int missedDays = countMissedDays(item);
        double rate = calculateComplianceRate(item);
        String risk = calculateRiskLevel(rate);

        return new MonitoringResponse(expected, taken, missedDays, rate, risk);
    }
}