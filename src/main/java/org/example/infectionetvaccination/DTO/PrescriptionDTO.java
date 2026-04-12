package org.example.infectionetvaccination.DTO;

import java.time.LocalDate;

public class PrescriptionDTO {

    private Long id;
    private Long patientId;
    private LocalDate prescriptionDate;
    private String notes;

    // ───── Constructors ─────
    public PrescriptionDTO() {
    }

    public PrescriptionDTO(Long id, Long patientId, LocalDate prescriptionDate, String notes) {
        this.id = id;
        this.patientId = patientId;
        this.prescriptionDate = prescriptionDate;
        this.notes = notes;
    }

    // ───── Getters ─────
    public Long getId() {
        return id;
    }

    public Long getPatientId() {
        return patientId;
    }

    public LocalDate getPrescriptionDate() {
        return prescriptionDate;
    }

    public String getNotes() {
        return notes;
    }

    // ───── Setters ─────
    public void setId(Long id) {
        this.id = id;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public void setPrescriptionDate(LocalDate prescriptionDate) {
        this.prescriptionDate = prescriptionDate;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}