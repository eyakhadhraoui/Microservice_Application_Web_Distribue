package com.example.prescription_Service.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "doctor_alert")
public class DoctorAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long patientId;
    private Long prescriptionItemId;
    private String medicationName;
    private Boolean isImmunosuppressor = false;

    // MISSED_DOSE  → dose unique manquée
    // MISSED_DAY   → toute la journée sans prise
    // CONSECUTIVE  → X jours consécutifs manqués
    private String alertType;

    // WARNING  → médicament normal
    // CRITICAL → immunosuppresseur
    private String severity;

    private String message;
    private Integer missedDaysCount = 0;   // nb jours consécutifs manqués
    private LocalDateTime triggeredAt;
    private Boolean isRead = false;

    public DoctorAlert() {}

    public DoctorAlert(Long patientId, Long prescriptionItemId,
                       String medicationName, Boolean isImmunosuppressor,
                       String alertType, String severity,
                       String message, Integer missedDaysCount,
                       LocalDateTime triggeredAt) {
        this.patientId           = patientId;
        this.prescriptionItemId  = prescriptionItemId;
        this.medicationName      = medicationName;
        this.isImmunosuppressor  = isImmunosuppressor;
        this.alertType           = alertType;
        this.severity            = severity;
        this.message             = message;
        this.missedDaysCount     = missedDaysCount;
        this.triggeredAt         = triggeredAt;
        this.isRead              = false;
    }

    // Getters & Setters
    public Long getId()                          { return id; }
    public void setId(Long id)                   { this.id = id; }

    public Long getPatientId()                   { return patientId; }
    public void setPatientId(Long v)             { this.patientId = v; }

    public Long getPrescriptionItemId()          { return prescriptionItemId; }
    public void setPrescriptionItemId(Long v)    { this.prescriptionItemId = v; }

    public String getMedicationName()            { return medicationName; }
    public void setMedicationName(String v)      { this.medicationName = v; }

    public Boolean getIsImmunosuppressor()       { return isImmunosuppressor; }
    public void setIsImmunosuppressor(Boolean v) { this.isImmunosuppressor = v; }

    public String getAlertType()                 { return alertType; }
    public void setAlertType(String v)           { this.alertType = v; }

    public String getSeverity()                  { return severity; }
    public void setSeverity(String v)            { this.severity = v; }

    public String getMessage()                   { return message; }
    public void setMessage(String v)             { this.message = v; }

    public Integer getMissedDaysCount()          { return missedDaysCount; }
    public void setMissedDaysCount(Integer v)    { this.missedDaysCount = v; }

    public LocalDateTime getTriggeredAt()        { return triggeredAt; }
    public void setTriggeredAt(LocalDateTime v)  { this.triggeredAt = v; }

    public Boolean getIsRead()                   { return isRead; }
    public void setIsRead(Boolean v)             { this.isRead = v; }
}