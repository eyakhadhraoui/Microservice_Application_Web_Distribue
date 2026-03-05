package org.example.infectionetvaccination.Entity;


import jakarta.persistence.*;

import java.util.Date;
import java.util.List;

@Entity
public class Vaccination {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    private String name;
    private Date vaccination_date;
    private String patientName;
    private Date booster_date;
    private boolean taken = false;         // ← add
    private boolean booster_taken = false; // ← add

    @ManyToOne
    @JoinColumn(name = "infection_id")
    private Infection infection;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Date getVaccination_date() {
        return vaccination_date;
    }

    public void setVaccination_date(Date vaccination_date) {
        this.vaccination_date = vaccination_date;
    }

    public Date getBooster_date() {
        return booster_date;
    }

    public void setBooster_date(Date booster_date) {
        this.booster_date = booster_date;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public boolean isTaken() { return taken; }
    public void setTaken(boolean taken) { this.taken = taken; }

    public boolean isBooster_taken() { return booster_taken; }
    public void setBooster_taken(boolean booster_taken) { this.booster_taken = booster_taken; }

    public Vaccination(){}

    public Vaccination(String name, Date vaccination_date, Date booster_date) {
        this.name = name;
        this.vaccination_date = vaccination_date;
        this.booster_date = booster_date;
    }
    public String getPatientName() { return patientName; }           // ← ADD
    public void setPatientName(String patientName) { this.patientName = patientName; } // ← ADD

}