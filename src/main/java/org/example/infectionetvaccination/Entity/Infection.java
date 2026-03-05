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
    private String patientName;

    @OneToMany(mappedBy = "infection", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Vaccination> vaccinations;

    public Infection() {}

    public Infection(String type, Date detectionDate, String severity, String patientName) {
        this.type = type;
        this.detectionDate = detectionDate;
        this.severity = severity;
        this.patientName = patientName;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Date getDetectionDate() { return detectionDate; }
    public void setDetectionDate(Date detectionDate) { this.detectionDate = detectionDate; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public List<Vaccination> getVaccinations() { return vaccinations; }
    public void setVaccinations(List<Vaccination> vaccinations) { this.vaccinations = vaccinations; }
}