package com.example.prescription_Service.controller;

import com.example.prescription_Service.service.MonitoringResponse;
import com.example.prescription_Service.service.TreatmentMonitoringService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/monitoring")
public class MonitoringController {

    private final TreatmentMonitoringService service;

    public MonitoringController(TreatmentMonitoringService service) {
        this.service = service;
    }

    @GetMapping("/{itemId}")
    public MonitoringResponse getMonitoring(@PathVariable Long itemId) {
        return service.getMonitoringData(itemId);
    }
}