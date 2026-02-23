package org.example.infectionetvaccination.Service;

import org.example.infectionetvaccination.Entity.Vaccination;
import org.example.infectionetvaccination.Repository.VaccinationRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class VaccinationService {

    private final VaccinationRepository vaccinationRepository;

    public VaccinationService(VaccinationRepository vaccinationRepository) {
        this.vaccinationRepository = vaccinationRepository;
    }

    public Vaccination save(Vaccination vaccination) {
        return vaccinationRepository.save(vaccination);
    }

    public List<Vaccination> findAll() {
        return vaccinationRepository.findAll();
    }

    public Optional<Vaccination> findById(int id) {
        return vaccinationRepository.findById(id);
    }

    public List<Vaccination> findByInfectionId(int infectionId) {
        return vaccinationRepository.findByInfectionId(infectionId);
    }

    public void delete(int id) {
        vaccinationRepository.deleteById(id);
    }
}