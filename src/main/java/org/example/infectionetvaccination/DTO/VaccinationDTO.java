package org.example.infectionetvaccination.DTO;

import java.util.Date;

public class VaccinationDTO {

    private int id;
    private String name;
    private Date vaccination_date;
    private Date booster_date;
    private String patientName;
    private boolean taken;
    private boolean booster_taken;

    // optional: keep only ID reference if needed
    private Integer infectionId;

    // ───── Constructors ─────
    public VaccinationDTO() {}

    public VaccinationDTO(int id, String name, Date vaccination_date,
                          Date booster_date, String patientName,
                          boolean taken, boolean booster_taken,
                          Integer infectionId) {
        this.id = id;
        this.name = name;
        this.vaccination_date = vaccination_date;
        this.booster_date = booster_date;
        this.patientName = patientName;
        this.taken = taken;
        this.booster_taken = booster_taken;
        this.infectionId = infectionId;
    }

    // ───── Getters ─────
    public int getId() { return id; }
    public String getName() { return name; }
    public Date getVaccination_date() { return vaccination_date; }
    public Date getBooster_date() { return booster_date; }
    public String getPatientName() { return patientName; }
    public boolean isTaken() { return taken; }
    public boolean isBooster_taken() { return booster_taken; }
    public Integer getInfectionId() { return infectionId; }

    // ───── Setters ─────
    public void setId(int id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setVaccination_date(Date vaccination_date) { this.vaccination_date = vaccination_date; }
    public void setBooster_date(Date booster_date) { this.booster_date = booster_date; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public void setTaken(boolean taken) { this.taken = taken; }
    public void setBooster_taken(boolean booster_taken) { this.booster_taken = booster_taken; }
    public void setInfectionId(Integer infectionId) { this.infectionId = infectionId; }
}
