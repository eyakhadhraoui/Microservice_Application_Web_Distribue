package com.example.prescription_Service.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
public class PrescriptionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "prescription_id")
    @JsonIgnore
    private Prescription prescription;

    @ManyToOne
    @JoinColumn(name = "medication_id")
    private Medication medication;

    private String dosageInstructions;
    private String frequency;
    private Integer duration;
    private String administrationRoute;
    private LocalDate startDate;
    private LocalDate endDate;
    private String specialInstructions;
    private Boolean isPriority;

    // ✅ NOUVEAU
    private Boolean isImmunosuppressor = false;

    // ✅ NOUVEAU
    @OneToMany(mappedBy = "prescriptionItem", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<MedicationSchedule> schedules = new ArrayList<>();

    // Constructeurs
    public PrescriptionItem() {}

    public PrescriptionItem(Medication medication, String dosageInstructions,
                            String frequency, Integer duration,
                            String administrationRoute, LocalDate startDate,
                            LocalDate endDate, String specialInstructions,
                            Boolean isPriority) {
        this.medication = medication;
        this.dosageInstructions = dosageInstructions;
        this.frequency = frequency;
        this.duration = duration;
        this.administrationRoute = administrationRoute;
        this.startDate = startDate;
        this.endDate = endDate;
        this.specialInstructions = specialInstructions;
        this.isPriority = isPriority;
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Prescription getPrescription() { return prescription; }
    public void setPrescription(Prescription prescription) {
        this.prescription = prescription;
    }

    public Medication getMedication() { return medication; }
    public void setMedication(Medication medication) {
        this.medication = medication;
    }

    public String getDosageInstructions() { return dosageInstructions; }
    public void setDosageInstructions(String dosageInstructions) {
        this.dosageInstructions = dosageInstructions;
    }

    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }

    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }

    public String getAdministrationRoute() { return administrationRoute; }
    public void setAdministrationRoute(String administrationRoute) {
        this.administrationRoute = administrationRoute;
    }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) {
        this.specialInstructions = specialInstructions;
    }

    public Boolean getIsPriority() { return isPriority; }
    public void setIsPriority(Boolean isPriority) {
        this.isPriority = isPriority;
    }

    public Boolean getIsImmunosuppressor() { return isImmunosuppressor; }
    public void setIsImmunosuppressor(Boolean isImmunosuppressor) {
        this.isImmunosuppressor = isImmunosuppressor;
    }

    public List<MedicationSchedule> getSchedules() { return schedules; }
    public void setSchedules(List<MedicationSchedule> schedules) {
        this.schedules = schedules;
    }
}