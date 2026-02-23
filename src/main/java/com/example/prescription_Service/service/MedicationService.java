package com.example.prescription_Service.service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.example.prescription_Service.dto.MedicationDTO;
import com.example.prescription_Service.entity.Medication;
import com.example.prescription_Service.repository.MedicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MedicationService {

    private final MedicationRepository medicationRepository;

    // Convertir Entity → DTO
    private MedicationDTO toDTO(Medication medication) {
        MedicationDTO dto = new MedicationDTO();
        dto.setId(medication.getId());
        dto.setName(medication.getName());
        dto.setDosage(medication.getDosage());
        dto.setUnit(medication.getUnit());
        dto.setForm(medication.getForm());
        dto.setActiveIngredient(medication.getActiveIngredient());
        dto.setCategory(medication.getCategory());
        dto.setRequiresMonitoring(medication.getRequiresMonitoring());
        dto.setContraindications(medication.getContraindications());
        return dto;
    }

    // Convertir DTO → Entity
    private Medication toEntity(MedicationDTO dto) {
        Medication medication = new Medication();
        medication.setName(dto.getName());
        medication.setDosage(dto.getDosage());
        medication.setUnit(dto.getUnit());
        medication.setForm(dto.getForm());
        medication.setActiveIngredient(dto.getActiveIngredient());
        medication.setCategory(dto.getCategory());
        medication.setRequiresMonitoring(dto.getRequiresMonitoring());
        medication.setContraindications(dto.getContraindications());
        return medication;
    }
    // ═══════════════════ CRÉER - REMPLACER CETTE MÉTHODE ═══════════════════
    public MedicationDTO createMedication(MedicationDTO medicationDTO) {
        // ✅ VÉRIFIER SI LE NOM EXISTE DÉJÀ
        String name = medicationDTO.getName().trim();
        if (medicationRepository.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Un médicament avec ce nom existe déjà"
            );
        }

        Medication medication = toEntity(medicationDTO);
        Medication savedMedication = medicationRepository.save(medication);
        return toDTO(savedMedication);
    }

    // ═══════════════════ METTRE À JOUR - REMPLACER CETTE MÉTHODE ═══════════════════
    public MedicationDTO updateMedication(Long id, MedicationDTO medicationDTO) {
        Medication medication = medicationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Médicament non trouvé avec l'ID: " + id
                ));

        // ✅ VÉRIFIER QU'AUCUN AUTRE MÉDICAMENT N'A CE NOM
        String newName = medicationDTO.getName().trim();
        if (medicationRepository.existsByNameIgnoreCaseAndIdNot(newName, id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Un médicament avec ce nom existe déjà"
            );
        }

        medication.setName(newName);
        medication.setDosage(medicationDTO.getDosage());
        medication.setUnit(medicationDTO.getUnit());
        medication.setForm(medicationDTO.getForm());
        medication.setActiveIngredient(medicationDTO.getActiveIngredient());
        medication.setCategory(medicationDTO.getCategory());
        medication.setRequiresMonitoring(medicationDTO.getRequiresMonitoring());
        medication.setContraindications(medicationDTO.getContraindications());

        Medication updatedMedication = medicationRepository.save(medication);
        return toDTO(updatedMedication);
    }
    // Récupérer un médicament par ID
    @Transactional(readOnly = true)
    public MedicationDTO getMedicationById(Long id) {
        Medication medication = medicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Médicament non trouvé avec l'ID: " + id));
        return toDTO(medication);
    }

    // Récupérer tous les médicaments
    @Transactional(readOnly = true)
    public List<MedicationDTO> getAllMedications() {
        return medicationRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Rechercher par nom
    @Transactional(readOnly = true)
    public List<MedicationDTO> searchByName(String name) {
        return medicationRepository.findByNameContainingIgnoreCase(name).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Rechercher par catégorie
    @Transactional(readOnly = true)
    public List<MedicationDTO> getByCategory(String category) {
        return medicationRepository.findByCategory(category).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Médicaments nécessitant surveillance
    @Transactional(readOnly = true)
    public List<MedicationDTO> getMedicationsRequiringMonitoring() {
        return medicationRepository.findByRequiresMonitoring(true).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Rechercher par principe actif
    @Transactional(readOnly = true)
    public List<MedicationDTO> searchByActiveIngredient(String activeIngredient) {
        return medicationRepository.findByActiveIngredientContainingIgnoreCase(activeIngredient).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Supprimer un médicament
    public void deleteMedication(Long id) {
        if (!medicationRepository.existsById(id)) {
            throw new RuntimeException("Médicament non trouvé avec l'ID: " + id);
        }
        medicationRepository.deleteById(id);
    }
}