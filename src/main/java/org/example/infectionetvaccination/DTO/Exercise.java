package org.example.infectionetvaccination.DTO;



public class Exercise {

    private Long id;
    private String name;
    private String description;
    private Integer durationMinutes;
    private String intensityLevel;
    private Boolean completed;



    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getIntensityLevel() {
        return intensityLevel;
    }

    public void setIntensityLevel(String intensityLevel) {
        this.intensityLevel = intensityLevel;
    }

    public Boolean getCompleted() {
        return completed;
    }

    public void setCompleted(Boolean completed) {
        this.completed = completed;
    }

    public Exercise(){}

    public Exercise(String name, String description, Integer durationMinutes, String intensityLevel, Boolean completed) {
        this.name = name;
        this.description = description;
        this.durationMinutes = durationMinutes;
        this.intensityLevel = intensityLevel;
        this.completed = completed;
    }
}
