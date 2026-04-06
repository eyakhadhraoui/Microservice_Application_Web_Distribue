package com.example.dossiermedicale.Services;

import com.example.dossiermedicale.Entities.DossierMedical;
import com.example.dossiermedicale.Entities.Patient;
import com.example.dossiermedicale.Entities.Suivi;
import com.example.dossiermedicale.Repository.DossierMedicalRepository;
import com.example.dossiermedicale.Repository.PatientRepository;
import com.example.dossiermedicale.Repository.SuiviRepository;
import com.example.dossiermedicale.dto.SuiviDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SuiviService {

    private final SuiviRepository suiviRepository;
    private final DossierMedicalRepository dossierMedicalRepository;
    private final PatientRepository patientRepository;
    private final NotificationService notificationService;

    private SuiviDTO toDTO(Suivi suivi) {
        SuiviDTO dto = new SuiviDTO();
        dto.setIdSuivi(suivi.getIdSuivi());
        dto.setIdDossierMedical(suivi.getDossierMedical().getIdDossierMedical());
        dto.setDateSuivi(suivi.getDateSuivi());
        dto.setNotes(suivi.getNotes());
        dto.setObjectif(suivi.getObjectif());
        dto.setResultat(suivi.getResultat());
        dto.setCheminPieceJointe(suivi.getCheminPieceJointe());
        return dto;
    }

    private Suivi toEntity(SuiviDTO dto) {
        Suivi suivi = new Suivi();

        DossierMedical dossier = dossierMedicalRepository.findById(dto.getIdDossierMedical())
                .orElseThrow(() -> new RuntimeException("Dossier médical non trouvé avec l'ID: " + dto.getIdDossierMedical()));

        suivi.setDossierMedical(dossier);
        suivi.setDateSuivi(dto.getDateSuivi());
        suivi.setNotes(dto.getNotes());
        suivi.setObjectif(dto.getObjectif());
        suivi.setResultat(dto.getResultat());
        suivi.setCheminPieceJointe(dto.getCheminPieceJointe());

        return suivi;
    }

    public SuiviDTO createSuivi(SuiviDTO suiviDTO) {
        Suivi suivi = toEntity(suiviDTO);
        Suivi savedSuivi = suiviRepository.save(suivi);
        // Envoi d'un email au patient si le médecin a ajouté un suivi (mail configuré + patient a un email)
        envoyerEmailSuiviAuPatient(savedSuivi);
        return toDTO(savedSuivi);
    }

    private void envoyerEmailSuiviAuPatient(Suivi suivi) {
        try {
            DossierMedical dossier = suivi.getDossierMedical();
            if (dossier == null || dossier.getIdPatient() == null) return;
            Optional<Patient> optPatient = patientRepository.findById(dossier.getIdPatient());
            if (optPatient.isEmpty()) return;
            Patient p = optPatient.get();
            String email = p.getEmail();
            if (email == null || email.isBlank()) return;
            String patientName = (p.getFirstName() != null ? p.getFirstName() : "") + " " + (p.getLastName() != null ? p.getLastName() : "").trim();
            String dateSuivi = suivi.getDateSuivi() != null ? suivi.getDateSuivi().toString() : "";
            String resultat = suivi.getResultat() != null ? suivi.getResultat().name() : "";
            String notes = suivi.getNotes();
            String cheminPieceJointe = suivi.getCheminPieceJointe();
            notificationService.envoyerSuiviAjouteAuPatient(email, patientName, dossier.getIdDossierMedical(), dateSuivi, resultat, notes, cheminPieceJointe != null ? cheminPieceJointe : "");
        } catch (Exception e) {
            // Ne pas faire échouer la création du suivi si l'email échoue
        }
    }

    public SuiviDTO updateSuivi(Long id, SuiviDTO suiviDTO) {
        Suivi suivi = suiviRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Suivi non trouvé avec l'ID: " + id));

        if (!suivi.getDossierMedical().getIdDossierMedical().equals(suiviDTO.getIdDossierMedical())) {
            DossierMedical newDossier = dossierMedicalRepository.findById(suiviDTO.getIdDossierMedical())
                    .orElseThrow(() -> new RuntimeException("Dossier médical non trouvé avec l'ID: " + suiviDTO.getIdDossierMedical()));
            suivi.setDossierMedical(newDossier);
        }

        suivi.setDateSuivi(suiviDTO.getDateSuivi());
        suivi.setNotes(suiviDTO.getNotes());
        suivi.setObjectif(suiviDTO.getObjectif());
        suivi.setResultat(suiviDTO.getResultat());
        suivi.setCheminPieceJointe(suiviDTO.getCheminPieceJointe());

        Suivi updatedSuivi = suiviRepository.save(suivi);
        return toDTO(updatedSuivi);
    }

    @Transactional(readOnly = true)
    public SuiviDTO getSuiviById(Long id) {
        Suivi suivi = suiviRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Suivi non trouvé avec l'ID: " + id));
        return toDTO(suivi);
    }

    @Transactional(readOnly = true)
    public List<SuiviDTO> getAllSuivis() {
        return suiviRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SuiviDTO> getSuivisByDossier(Long idDossierMedical) {
        return suiviRepository.findByDossierMedicalIdDossierMedicalOrderByDateSuiviDesc(idDossierMedical).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public void deleteSuivi(Long id) {
        if (!suiviRepository.existsById(id)) {
            throw new RuntimeException("Suivi non trouvé avec l'ID: " + id);
        }
        suiviRepository.deleteById(id);
    }
}