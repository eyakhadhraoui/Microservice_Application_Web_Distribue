package com.example.prescription_Service.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dosage_adjustment")
public class DosageAdjustment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "prescription_item_id")
    private PrescriptionItem prescriptionItem;

    private Long   patientId;
    private Double currentDose;
    private Double suggestedDose;
    private Double weightUsed;
    private Double previousWeight;
    private String reason;
    private String status = "PENDING";
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
    private String reviewedBy;

    public DosageAdjustment() {}

    public DosageAdjustment(PrescriptionItem prescriptionItem, Long patientId,
                            Double currentDose, Double suggestedDose,
                            Double weightUsed, Double previousWeight, String reason) {
        this.prescriptionItem = prescriptionItem;
        this.patientId        = patientId;
        this.currentDose      = currentDose;
        this.suggestedDose    = suggestedDose;
        this.weightUsed       = weightUsed;
        this.previousWeight   = previousWeight;
        this.reason           = reason;
        this.status           = "PENDING";
        this.createdAt        = LocalDateTime.now();
    }

    public Long getId()                                { return id; }
    public void setId(Long id)                         { this.id = id; }
    public PrescriptionItem getPrescriptionItem()      { return prescriptionItem; }
    public void setPrescriptionItem(PrescriptionItem v){ this.prescriptionItem = v; }
    public Long getPatientId()                         { return patientId; }
    public void setPatientId(Long v)                   { this.patientId = v; }
    public Double getCurrentDose()                     { return currentDose; }
    public void setCurrentDose(Double v)               { this.currentDose = v; }
    public Double getSuggestedDose()                   { return suggestedDose; }
    public void setSuggestedDose(Double v)             { this.suggestedDose = v; }
    public Double getWeightUsed()                      { return weightUsed; }
    public void setWeightUsed(Double v)                { this.weightUsed = v; }
    public Double getPreviousWeight()                  { return previousWeight; }
    public void setPreviousWeight(Double v)            { this.previousWeight = v; }
    public String getReason()                          { return reason; }
    public void setReason(String v)                    { this.reason = v; }
    public String getStatus()                          { return status; }
    public void setStatus(String v)                    { this.status = v; }
    public LocalDateTime getCreatedAt()                { return createdAt; }
    public void setCreatedAt(LocalDateTime v)          { this.createdAt = v; }
    public LocalDateTime getReviewedAt()               { return reviewedAt; }
    public void setReviewedAt(LocalDateTime v)         { this.reviewedAt = v; }
    public String getReviewedBy()                      { return reviewedBy; }
    public void setReviewedBy(String v)                { this.reviewedBy = v; }
}