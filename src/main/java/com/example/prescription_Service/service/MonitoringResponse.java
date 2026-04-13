package com.example.prescription_Service.service;

public class MonitoringResponse {

    private int expectedDoses;
    private int takenDoses;
    private int missedDays;
    private double complianceRate;
    private String riskLevel;

    public MonitoringResponse(int expectedDoses, int takenDoses,
                              int missedDays, double complianceRate,
                              String riskLevel) {
        this.expectedDoses = expectedDoses;
        this.takenDoses = takenDoses;
        this.missedDays = missedDays;
        this.complianceRate = complianceRate;
        this.riskLevel = riskLevel;
    }

    public int getExpectedDoses() { return expectedDoses; }
    public int getTakenDoses() { return takenDoses; }
    public int getMissedDays() { return missedDays; }
    public double getComplianceRate() { return complianceRate; }
    public String getRiskLevel() { return riskLevel; }
}