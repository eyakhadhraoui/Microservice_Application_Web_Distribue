package com.example.dossiermedicale.Services;

import com.example.dossiermedicale.Entities.DossierMedical;
import com.example.dossiermedicale.Repository.DossierMedicalRepository;
import com.example.dossiermedicale.Repository.SuiviRepository;
import com.example.dossiermedicale.dto.AlerteDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AlerteService {

    private final DossierMedicalRepository dossierMedicalRepository;
    private final SuiviRepository suiviRepository;

    @Value("${alerte.suivi.jours:90}")
    private int defaultJoursSansSuivi;

    /**
     * Liste des dossiers pour lesquels aucun suivi n'a été enregistré depuis au moins N jours.
     * @param jours seuil en jours (optionnel, sinon utilise alerte.suivi.jours)
     * @param idMedecin filtre par médecin (optionnel)
     */
    @Transactional(readOnly = true)
    public List<AlerteDTO> getAlertesSansSuivi(Integer jours, Long idMedecin) {
        int n = jours != null && jours > 0 ? jours : defaultJoursSansSuivi;
        LocalDate today = LocalDate.now();
        LocalDate seuil = today.minusDays(n);

        List<DossierMedical> dossiers = idMedecin != null
                ? dossierMedicalRepository.findByIdMedecin(idMedecin)
                : dossierMedicalRepository.findAll();

        List<AlerteDTO> result = new ArrayList<>();
        for (DossierMedical d : dossiers) {
            Optional<LocalDate> lastSuivi = suiviRepository
                    .findByDossierMedicalIdDossierMedicalOrderByDateSuiviDesc(d.getIdDossierMedical())
                    .stream()
                    .findFirst()
                    .map(s -> s.getDateSuivi());

            long joursSansSuivi;
            LocalDate dateDernierSuivi;
            if (lastSuivi.isEmpty()) {
                joursSansSuivi = ChronoUnit.DAYS.between(d.getDateCreation(), today);
                dateDernierSuivi = d.getDateCreation();
            } else {
                dateDernierSuivi = lastSuivi.get();
                joursSansSuivi = ChronoUnit.DAYS.between(dateDernierSuivi, today);
            }

            if (joursSansSuivi >= n) {
                String libelle = lastSuivi.isEmpty()
                        ? "Aucun suivi enregistré depuis la création (il y a " + joursSansSuivi + " jours)"
                        : "Aucun suivi depuis " + joursSansSuivi + " jours (dernier : " + dateDernierSuivi + ")";
                result.add(new AlerteDTO(
                        d.getIdDossierMedical(),
                        d.getIdPatient(),
                        d.getIdMedecin(),
                        dateDernierSuivi,
                        joursSansSuivi,
                        libelle
                ));
            }
        }
        return result;
    }
}
