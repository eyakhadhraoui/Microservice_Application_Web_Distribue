package org.example.infectionetvaccination;

import org.example.infectionetvaccination.Config.FeignJacksonConfig;
import org.example.infectionetvaccination.DTO.PrescriptionDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@FeignClient(
        name = "prescription-service",
        url = "http://localhost:8086",
        configuration = FeignJacksonConfig.class

)
public interface PrescriptionClient {

    @GetMapping("/api/prescriptions")
    List<PrescriptionDTO> getAllPrescriptions();

    @GetMapping("/api/prescriptions/{id}")
    PrescriptionDTO getById(@PathVariable Long id);

    @GetMapping("/api/prescriptions/patient/{patientId}")
    List<PrescriptionDTO> getByPatient(@PathVariable Long patientId);

    @PostMapping("/api/prescriptions")
    PrescriptionDTO createPrescription(@RequestBody PrescriptionDTO dto);
}
