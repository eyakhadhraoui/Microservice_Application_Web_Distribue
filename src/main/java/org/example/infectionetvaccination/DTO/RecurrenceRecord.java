package org.example.infectionetvaccination.DTO;

import java.util.List;

public class RecurrenceRecord {
    private String type;
    private String patient;
    private int    count;
    private double chance;
    private String earliest;
    private String latest;
    private String riskLabel;  // "Low", "Moderate", "High"
    private List<String> reasons;

    // Getters & setters (or use Lombok @Data)
    public String getType()              { return type; }
    public void   setType(String v)      { this.type = v; }
    public String getPatient()           { return patient; }
    public void   setPatient(String v)   { this.patient = v; }
    public int    getCount()             { return count; }
    public void   setCount(int v)        { this.count = v; }
    public double getChance()            { return chance; }
    public void   setChance(double v)    { this.chance = v; }
    public String getEarliest()          { return earliest; }
    public void   setEarliest(String v)  { this.earliest = v; }
    public String getLatest()            { return latest; }
    public void   setLatest(String v)    { this.latest = v; }
    public String getRiskLabel()         { return riskLabel; }
    public void   setRiskLabel(String v) { this.riskLabel = v; }
    public List<String> getReasons()            { return reasons; }
    public void         setReasons(List<String> v) { this.reasons = v; }
}
