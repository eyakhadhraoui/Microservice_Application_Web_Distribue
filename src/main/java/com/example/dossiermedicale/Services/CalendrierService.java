package com.example.dossiermedicale.Services;

import com.example.dossiermedicale.Entities.ImageMedicale;
import com.example.dossiermedicale.Entities.Patient;
import com.example.dossiermedicale.Entities.Suivi;
import com.example.dossiermedicale.Repository.DossierMedicalRepository;
import com.example.dossiermedicale.Repository.ImageMedicaleRepository;
import com.example.dossiermedicale.Repository.PatientRepository;
import com.example.dossiermedicale.Repository.SuiviRepository;
import com.example.dossiermedicale.dto.CalendrierEventDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Agrège les suivis et images médicales des dossiers du patient pour le calendrier.
 */
@Service
@RequiredArgsConstructor
public class CalendrierService {

    private final PatientRepository patientRepository;
    private final DossierMedicalRepository dossierMedicalRepository;
    private final SuiviRepository suiviRepository;
    private final ImageMedicaleRepository imageMedicaleRepository;

    /**
     * Retourne tous les événements calendrier (suivis + images médicales) du patient connecté.
     * Chaque événement correspond à une action du médecin (ajout suivi ou image).
     */
    @Transactional(readOnly = true)
    public List<CalendrierEventDTO> getEvenementsPourPatient(String username) {
        Optional<Patient> opt = patientRepository.findByUsername(username);
        if (opt.isEmpty()) return List.of();
        Patient patient = opt.get();

        Set<Long> idDossiers = dossierMedicalRepository.findByIdPatient(patient.getIdPatient()).stream()
                .map(d -> d.getIdDossierMedical())
                .collect(Collectors.toSet());
        if (idDossiers.isEmpty()) return List.of();

        List<CalendrierEventDTO> events = new ArrayList<>();

        List<Suivi> suivis = suiviRepository.findByDossierMedical_IdDossierMedicalIn(idDossiers);
        for (Suivi s : suivis) {
            Long idDossier = s.getDossierMedical() != null ? s.getDossierMedical().getIdDossierMedical() : null;
            if (idDossier == null) continue;
            String titre = "Suivi — " + (s.getResultat() != null ? s.getResultat().getLibelle() : "Ajouté par le médecin");
            String desc = s.getNotes() != null && !s.getNotes().isBlank() ? s.getNotes() : null;
            if (desc != null && desc.length() > 100) desc = desc.substring(0, 97) + "...";
            events.add(new CalendrierEventDTO(
                    s.getDateSuivi(),
                    CalendrierEventDTO.TypeEvent.SUIVI,
                    titre,
                    s.getIdSuivi(),
                    idDossier,
                    desc
            ));
        }

        List<ImageMedicale> images = imageMedicaleRepository.findByDossierMedical_IdDossierMedicalIn(idDossiers);
        for (ImageMedicale img : images) {
            Long idDossier = img.getDossierMedical() != null ? img.getDossierMedical().getIdDossierMedical() : null;
            if (idDossier == null) continue;
            String titre = img.getTypeImage() != null ? img.getTypeImage().getLibelle() : "Image médicale";
            String desc = img.getDescription() != null && !img.getDescription().isBlank() ? img.getDescription() : null;
            if (desc != null && desc.length() > 100) desc = desc.substring(0, 97) + "...";
            events.add(new CalendrierEventDTO(
                    img.getDateCapture(),
                    CalendrierEventDTO.TypeEvent.IMAGE_MEDICALE,
                    titre,
                    img.getIdImage(),
                    idDossier,
                    desc
            ));
        }

        // Du plus récent au plus ancien (date décroissante), puis par type pour une même date
        events.sort((a, b) -> {
            int c = b.getDate().compareTo(a.getDate()); // inverse = plus récent d'abord
            if (c != 0) return c;
            return a.getType().compareTo(b.getType());
        });
        return events;
    }
}
