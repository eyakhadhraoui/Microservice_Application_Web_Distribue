package org.example.infectionetvaccination.RestController;


import org.example.infectionetvaccination.DTO.PrescriptionDTO;
import org.example.infectionetvaccination.Entity.Infection;
import org.example.infectionetvaccination.Service.InfectionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/infections")
public class InfectionRestController {

    private final InfectionService infectionService;

    public InfectionRestController(InfectionService infectionService) {
        this.infectionService = infectionService;
    }



    @PostMapping
    public Infection create(@RequestBody Infection infection) { return infectionService.save(infection); }

    @GetMapping
    public List<Infection> getAll() { return infectionService.findAll(); }

    @GetMapping("/{id}")
    public Infection getById(@PathVariable int id) { return infectionService.findById(id).orElseThrow(); }

    @PutMapping("/{id}")
    public Infection update(@PathVariable int id, @RequestBody Infection infection) {
        return infectionService.update(id, infection);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable int id) { infectionService.delete(id); }


    @GetMapping("/prescriptions")
    public List<PrescriptionDTO> getAllPrescriptions() {
        return infectionService.getAllPrescriptions();
    }

    @GetMapping("/prescriptions/{id}")
    public PrescriptionDTO getPrescriptionById(@PathVariable Long id) {
        return infectionService.getPrescriptionById(id);
    }

    @GetMapping("/patient/{patientId}/prescriptions")
    public List<PrescriptionDTO> getPatientPrescriptions(@PathVariable Long patientId) {
        return infectionService.getPatientPrescriptions(patientId);
    }

    @PostMapping("/prescriptions")
    public PrescriptionDTO createPrescription(@RequestBody PrescriptionDTO dto) {
        return infectionService.createPrescription(dto);
    }


}