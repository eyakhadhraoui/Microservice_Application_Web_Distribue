package com.example.prescription_Service.entity;

import jakarta.persistence.*;

@Entity
public class Medication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String dosage;
    private String unit;
    private String form;
    private String activeIngredient;
    private Boolean isImmunosuppressor = false;
    private String category;
    private Boolean requiresMonitoring;
    private String contraindications;

    // Constructeurs
    public Medication() {}

    public Medication(String name, String dosage, String unit, String form,
                      String activeIngredient, String category,
                      Boolean requiresMonitoring, String contraindications) {
        this.name = name;
        this.dosage = dosage;
        this.unit = unit;
        this.form = form;
        this.activeIngredient = activeIngredient;
        this.category = category;
        this.requiresMonitoring = requiresMonitoring;
        this.contraindications = contraindications;
        this.isImmunosuppressor = false;
    }

    public Medication(String name, String dosage, String unit, String form,
                      String activeIngredient, String category,
                      Boolean requiresMonitoring, String contraindications,
                      Boolean isImmunosuppressor) {
        this.name = name;
        this.dosage = dosage;
        this.unit = unit;
        this.form = form;
        this.activeIngredient = activeIngredient;
        this.category = category;
        this.requiresMonitoring = requiresMonitoring;
        this.contraindications = contraindications;
        this.isImmunosuppressor = isImmunosuppressor;
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDosage() { return dosage; }
    public void setDosage(String dosage) { this.dosage = dosage; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getForm() { return form; }
    public void setForm(String form) { this.form = form; }

    public String getActiveIngredient() { return activeIngredient; }
    public void setActiveIngredient(String activeIngredient) {
        this.activeIngredient = activeIngredient;
    }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Boolean getRequiresMonitoring() { return requiresMonitoring; }
    public void setRequiresMonitoring(Boolean requiresMonitoring) {
        this.requiresMonitoring = requiresMonitoring;
    }

    public String getContraindications() { return contraindications; }
    public void setContraindications(String contraindications) {
        this.contraindications = contraindications;
    }

    public Boolean getIsImmunosuppressor() { return isImmunosuppressor; }
    public void setIsImmunosuppressor(Boolean isImmunosuppressor) {
        this.isImmunosuppressor = isImmunosuppressor;
    }
}