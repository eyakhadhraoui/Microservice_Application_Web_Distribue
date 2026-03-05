package org.example.infectionetvaccination.RestController;

import org.example.infectionetvaccination.Entity.Vaccination;
import org.example.infectionetvaccination.Service.VaccinationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vaccinations")
public class VaccinationRestController {

    private final VaccinationService vaccinationService;



    public VaccinationRestController(VaccinationService vaccinationService) {
        this.vaccinationService = vaccinationService;
    }

    @PostMapping
    public Vaccination create(@RequestBody Vaccination vaccination) {
        return vaccinationService.save(vaccination);
    }

    @GetMapping
    public List<Vaccination> getAll() {
        return vaccinationService.findAll();
    }

    @GetMapping("/{id}")
    public Vaccination getById(@PathVariable int id) {
        return vaccinationService.findById(id).orElseThrow();
    }

    @GetMapping("/infection/{infectionId}")
    public List<Vaccination> getByInfection(@PathVariable int infectionId) {
        return vaccinationService.findByInfectionId(infectionId);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable int id) {
        vaccinationService.delete(id);
    }

    @PutMapping("/{id}")
    public Vaccination update(@PathVariable int id, @RequestBody Vaccination vaccination) {
        vaccination.setId(id);
        return vaccinationService.save(vaccination);
    }
}
