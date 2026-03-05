package org.example.infectionetvaccination.Service;

import org.example.infectionetvaccination.DTO.Exercise;
import org.example.infectionetvaccination.Entity.Infection;
import org.example.infectionetvaccination.ExerciseClient;
import org.example.infectionetvaccination.Repository.InfectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class InfectionService {

    private final InfectionRepository infectionRepository;

    public InfectionService(InfectionRepository infectionRepository) {
        this.infectionRepository = infectionRepository;
    }

    @Autowired
    private ExerciseClient exerciseServiceClient;

    public List<Exercise> getExercises() { return exerciseServiceClient.getAllExercises(); }
    public Exercise getExerciseById(int id) { return exerciseServiceClient.getExerciseById(id); }

    public Infection save(Infection infection) { return infectionRepository.save(infection); }
    public List<Infection> findAll() { return infectionRepository.findAll(); }
    public Optional<Infection> findById(int id) { return infectionRepository.findById(id); }
    public void delete(int id) { infectionRepository.deleteById(id); }

    public Infection update(int id, Infection updated) {
        Infection existing = infectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Infection not found: " + id));
        existing.setType(updated.getType());
        existing.setDetectionDate(updated.getDetectionDate());
        existing.setSeverity(updated.getSeverity());
        existing.setPatientName(updated.getPatientName());
        return infectionRepository.save(existing);
    }
}