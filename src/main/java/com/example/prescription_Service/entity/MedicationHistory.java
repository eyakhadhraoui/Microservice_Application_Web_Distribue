package com.example.prescription_Service.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class MedicationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "prescription_item_id")
    private PrescriptionItem prescriptionItem;

    // ID du patient (provenant du microservice Patient)
    private Long patientId;

    // Date et heure de la prise
    private LocalDateTime takenAt;

    // Statut de la prise
    private String status; // TAKEN, MISSED, DELAYED, REFUSED

    // Dose réellement prise (peut différer de la dose prescrite)
    private String actualDosage;

    // Notes sur la prise (effets secondaires, raisons du refus, etc.)
    private String notes;

    // Qui a administré (pour les enfants)
    private String administeredBy; // parent, infirmière, auto-administré

    // Effets secondaires observés
    private String sideEffects;

    // Température ou autres paramètres vitaux au moment de la prise
    private Double temperature;
    private String vitalSigns; // JSON ou texte libre

    // Constructeurs
    public MedicationHistory() {}

    public MedicationHistory(PrescriptionItem prescriptionItem, Long patientId,
                             LocalDateTime takenAt, String status, String actualDosage,
                             String notes, String administeredBy, String sideEffects,
                             Double temperature, String vitalSigns) {
        this.prescriptionItem = prescriptionItem;
        this.patientId = patientId;
        this.takenAt = takenAt;
        this.status = status;
        this.actualDosage = actualDosage;
        this.notes = notes;
        this.administeredBy = administeredBy;
        this.sideEffects = sideEffects;
        this.temperature = temperature;
        this.vitalSigns = vitalSigns;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public PrescriptionItem getPrescriptionItem() { return prescriptionItem; }
    public void setPrescriptionItem(PrescriptionItem prescriptionItem) {
        this.prescriptionItem = prescriptionItem;
    }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public LocalDateTime getTakenAt() { return takenAt; }
    public void setTakenAt(LocalDateTime takenAt) { this.takenAt = takenAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getActualDosage() { return actualDosage; }
    public void setActualDosage(String actualDosage) {
        this.actualDosage = actualDosage;
    }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getAdministeredBy() { return administeredBy; }
    public void setAdministeredBy(String administeredBy) {
        this.administeredBy = administeredBy;
    }

    public String getSideEffects() { return sideEffects; }
    public void setSideEffects(String sideEffects) {
        this.sideEffects = sideEffects;
    }

    public Double getTemperature() { return temperature; }
    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public String getVitalSigns() { return vitalSigns; }
    public void setVitalSigns(String vitalSigns) {
        this.vitalSigns = vitalSigns;
    }
}