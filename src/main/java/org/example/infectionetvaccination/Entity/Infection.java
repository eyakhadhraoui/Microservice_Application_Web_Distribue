package org.example.infectionetvaccination.Entity;


import jakarta.persistence.*;

import java.util.Date;
import java.util.List;

@Entity
public class Infection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String type;

    private Date detectionDate;

    private String severity;

    private String treatment;

    @OneToMany(mappedBy = "infection", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Vaccination> vaccinations;

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Date getDetectionDate() {
        return detectionDate;
    }

    public void setDetectionDate(Date detectionDate) {
        this.detectionDate = detectionDate;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getTreatment() {
        return treatment;
    }

    public void setreatment(String teatment) {
        this.treatment = teatment;
    }

    public List<Vaccination> getVaccinations() {
        return vaccinations;
    }

    public void setVaccinations(List<Vaccination> vaccinations) {
        this.vaccinations = vaccinations;
    }

    public void setTreatment(String treatment) {
        this.treatment = treatment;
    }

    public Infection(){}

    public Infection(String type, Date detectionDate, String severity, String treatment, List<Vaccination> vaccinations) {
        this.type = type;
        this.detectionDate = detectionDate;
        this.severity = severity;
        this.treatment = treatment;
        this.vaccinations = vaccinations;
    }

    public Infection(String type, Date detectionDate, String severity, String treatment) {
        this.type = type;
        this.detectionDate = detectionDate;
        this.severity = severity;
        this.treatment = treatment;
    }
}
