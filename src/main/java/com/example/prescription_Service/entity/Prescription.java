package com.example.prescription_Service.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "prescription")
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long patientId;              // ← remplace medicalRecordId

    @Column(nullable = false)
    private LocalDate prescriptionDate;

    private String notes;

    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PrescriptionItem> prescriptionItems = new ArrayList<>();

    // ─── Constructeurs ────────────────────────────────────────────────
    public Prescription() {}

    public Prescription(Long patientId, LocalDate prescriptionDate, String notes) {
        this.patientId = patientId;      // ← remplace medicalRecordId
        this.prescriptionDate = prescriptionDate;
        this.notes = notes;
    }

    // ─── Helpers ──────────────────────────────────────────────────────
    public void addPrescriptionItem(PrescriptionItem item) {
        prescriptionItems.add(item);
        item.setPrescription(this);
    }

    public void removePrescriptionItem(PrescriptionItem item) {
        prescriptionItems.remove(item);
        item.setPrescription(null);
    }

    // ─── Getters & Setters ────────────────────────────────────────────
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPatientId() { return patientId; }          // ← nouveau
    public void setPatientId(Long patientId) {
        this.patientId = patientId;                           // ← nouveau
    }

    public LocalDate getPrescriptionDate() { return prescriptionDate; }
    public void setPrescriptionDate(LocalDate prescriptionDate) {
        this.prescriptionDate = prescriptionDate;
    }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<PrescriptionItem> getPrescriptionItems() { return prescriptionItems; }
    public void setPrescriptionItems(List<PrescriptionItem> items) {
        this.prescriptionItems = items;
    }
}