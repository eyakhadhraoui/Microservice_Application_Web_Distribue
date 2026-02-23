package com.example.prescription_Service.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ID du MedicalRecord (provenant du microservice MedicalRecord)
    private Long medicalRecordId;

    private LocalDate prescriptionDate;

    private String notes; // Notes générales du médecin sur la prescription

    // Relation avec les items de prescription (médicaments prescrits)
    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PrescriptionItem> prescriptionItems = new ArrayList<>();

    // Constructeurs
    public Prescription() {}

    public Prescription(Long medicalRecordId, LocalDate prescriptionDate, String notes) {
        this.medicalRecordId = medicalRecordId;
        this.prescriptionDate = prescriptionDate;
        this.notes = notes;
    }

    // Méthode helper pour ajouter un item
    public void addPrescriptionItem(PrescriptionItem item) {
        prescriptionItems.add(item);
        item.setPrescription(this);
    }

    // Méthode helper pour retirer un item
    public void removePrescriptionItem(PrescriptionItem item) {
        prescriptionItems.remove(item);
        item.setPrescription(null);
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getMedicalRecordId() { return medicalRecordId; }
    public void setMedicalRecordId(Long medicalRecordId) {
        this.medicalRecordId = medicalRecordId;
    }

    public LocalDate getPrescriptionDate() { return prescriptionDate; }
    public void setPrescriptionDate(LocalDate prescriptionDate) {
        this.prescriptionDate = prescriptionDate;
    }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<PrescriptionItem> getPrescriptionItems() {
        return prescriptionItems;
    }
    public void setPrescriptionItems(List<PrescriptionItem> prescriptionItems) {
        this.prescriptionItems = prescriptionItems;
    }
}