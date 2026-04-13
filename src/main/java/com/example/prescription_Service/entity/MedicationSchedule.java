package com.example.prescription_Service.entity;

import jakarta.persistence.*;
import java.time.LocalTime;
import java.util.List;

@Entity
public class MedicationSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "prescription_item_id")
    private PrescriptionItem prescriptionItem;

    private LocalTime scheduledTime;

    // Constructeurs
    public MedicationSchedule() {}

    public MedicationSchedule(PrescriptionItem prescriptionItem, LocalTime scheduledTime) {
        this.prescriptionItem = prescriptionItem;
        this.scheduledTime = scheduledTime;
    }


    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public PrescriptionItem getPrescriptionItem() { return prescriptionItem; }
    public void setPrescriptionItem(PrescriptionItem prescriptionItem) {
        this.prescriptionItem = prescriptionItem;
    }

    public LocalTime getScheduledTime() { return scheduledTime; }
    public void setScheduledTime(LocalTime scheduledTime) {
        this.scheduledTime = scheduledTime;
    }
}