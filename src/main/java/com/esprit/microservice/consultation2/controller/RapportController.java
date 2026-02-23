package com.esprit.microservice.consultation2.controller;

import com.esprit.microservice.consultation2.Services.IRapportInterface;
import com.esprit.microservice.consultation2.dto.RapportDTO;
import com.esprit.microservice.consultation2.entity.Rapport;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@AllArgsConstructor
@RequestMapping("/rapport")
public class RapportController {
    @Autowired
    IRapportInterface iRapportInterface;


    @GetMapping("/retrieveRapports")
    public List<Rapport> retrieveRapports() {
        return iRapportInterface.retrieveRapports();
    }


    @PostMapping("/addRapport")
    public Rapport addRapport(@RequestBody RapportDTO rapportDTO) {
        return iRapportInterface.addRapport(rapportDTO);
    }



    @PutMapping("/updateRapport")
    public Rapport updateRapport(@RequestBody RapportDTO rapportDTO) {
        return iRapportInterface.updateRapport(rapportDTO);
    }


    // Retrieve rapport by id
    @GetMapping("/retrieveRapport/{rapport-id}")
    public Optional<Rapport> retrieveRapport(@PathVariable("rapport-id") Integer idRapport) {
        return iRapportInterface.retrieveRapport(idRapport);
    }

    // Delete rapport
    @DeleteMapping("/removeRapport/{rapport-id}")
    public void removeRapport(@PathVariable("rapport-id") Integer idRapport) {
        iRapportInterface.removeRapport(idRapport);
    }
}
