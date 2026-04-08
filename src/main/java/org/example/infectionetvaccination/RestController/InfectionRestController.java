package org.example.infectionetvaccination.RestController;


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
}