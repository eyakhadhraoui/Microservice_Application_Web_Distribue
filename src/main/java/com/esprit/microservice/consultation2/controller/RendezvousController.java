package com.esprit.microservice.consultation2.controller;

import com.esprit.microservice.consultation2.Services.IRendezvousInterface;
import com.esprit.microservice.consultation2.dto.RendezvousDTO;
import com.esprit.microservice.consultation2.entity.Rendezvous;
import org.springframework.web.bind.annotation.GetMapping;


import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
@RequestMapping("/rendezvous")
public class RendezvousController {

    private final IRendezvousInterface iRendezvousInterface;

    @GetMapping("/retrieveRendezvous")
    public List<Rendezvous> retrieveRendezvous() {
        return iRendezvousInterface.retrieveRendezvous();
    }

    @PostMapping("/addRendezvous")
    public Rendezvous addRendezvous(@RequestBody RendezvousDTO rendezvousDTO) {
        return iRendezvousInterface.addRendezvous(rendezvousDTO);
    }

    @PutMapping("/updateRendezvous")
    public Rendezvous updateRendezvous(@RequestBody RendezvousDTO rendezvousDTO) {
        return iRendezvousInterface.updateRendezvous(rendezvousDTO);
    }

    @GetMapping("/retrieveRendezvous/{id}")
    public Optional<Rendezvous> retrieveRendezvousById(@PathVariable Integer id) {
        return iRendezvousInterface.retrieveRendezvousById(id);
    }

    @DeleteMapping("/removeRendezvous/{id}")
    public void removeRendezvous(@PathVariable Integer id) {
        iRendezvousInterface.removeRendezvous(id);
    }
}
