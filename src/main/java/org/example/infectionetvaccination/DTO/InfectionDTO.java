package org.example.infectionetvaccination.DTO;



import java.util.Date;
import java.util.List;

public class InfectionDTO {

    private int id;
    private String type;
    private Date detectionDate;
    private String severity;
    private String patientName;

    private List<VaccinationDTO> vaccinations;

    // ───── Constructors ─────
    public InfectionDTO() {}

    public InfectionDTO(int id, String type, Date detectionDate,
                        String severity, String patientName,
                        List<VaccinationDTO> vaccinations) {
        this.id = id;
        this.type = type;
        this.detectionDate = detectionDate;
        this.severity = severity;
        this.patientName = patientName;
        this.vaccinations = vaccinations;
    }

    // ───── Getters ─────
    public int getId() { return id; }
    public String getType() { return type; }
    public Date getDetectionDate() { return detectionDate; }
    public String getSeverity() { return severity; }
    public String getPatientName() { return patientName; }
    public List<VaccinationDTO> getVaccinations() { return vaccinations; }

    // ───── Setters ─────
    public void setId(int id) { this.id = id; }
    public void setType(String type) { this.type = type; }
    public void setDetectionDate(Date detectionDate) { this.detectionDate = detectionDate; }
    public void setSeverity(String severity) { this.severity = severity; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public void setVaccinations(List<VaccinationDTO> vaccinations) {
        this.vaccinations = vaccinations;
    }
}
