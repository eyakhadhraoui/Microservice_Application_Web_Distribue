package com.example.dossiermedicale.Services;

import com.example.dossiermedicale.Entities.NotificationMedecin;
import com.example.dossiermedicale.Enum.TypeNotificationMedecin;
import com.example.dossiermedicale.Repository.NotificationMedecinRepository;
import com.example.dossiermedicale.dto.NotificationMedecinDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationMedecinService {

    private final NotificationMedecinRepository notificationMedecinRepository;

    private static NotificationMedecinDTO toDTO(NotificationMedecin n) {
        NotificationMedecinDTO dto = new NotificationMedecinDTO();
        dto.setIdNotificationMedecin(n.getIdNotificationMedecin());
        dto.setIdMedecin(n.getIdMedecin());
        dto.setIdDossierMedical(n.getIdDossierMedical());
        dto.setIdPatient(n.getIdPatient());
        dto.setPatientName(n.getPatientName());
        dto.setType(n.getType());
        dto.setTitre(n.getTitre());
        dto.setMessage(n.getMessage());
        dto.setIdResultatLaboratoire(n.getIdResultatLaboratoire());
        dto.setLu(n.getLu());
        dto.setDateCreation(n.getDateCreation());
        dto.setSeverity(
                n.getType() == TypeNotificationMedecin.MEDICAMENT_NON_PRIS || n.getType() == TypeNotificationMedecin.ALERTE_LABO
                        ? "CRITICAL" : "WARNING");
        return dto;
    }

    /**
     * Appelé quand un patient (ou le système) ajoute un résultat de test laboratoire.
     * Crée une notification pour le médecin du dossier.
     */
    public void creerPourNouveauTestLabo(Long idMedecin, Long idDossierMedical,
                                         Long idResultatLaboratoire, String nomPatient,
                                         String nomTest, String dateResultat) {
        String titre = "Nouveau résultat de test laboratoire";
        String message = String.format("Le patient %s a ajouté un résultat pour le test « %s » (date: %s).",
                nomPatient != null && !nomPatient.isBlank() ? nomPatient : "—",
                nomTest != null && !nomTest.isBlank() ? nomTest : "—",
                dateResultat != null ? dateResultat : "—");
        NotificationMedecin notif = NotificationMedecin.builder()
                .idMedecin(idMedecin)
                .idDossierMedical(idDossierMedical)
                .type(TypeNotificationMedecin.NOUVEAU_TEST_LABO)
                .titre(titre)
                .message(message)
                .idResultatLaboratoire(idResultatLaboratoire)
                .lu(false)
                .dateCreation(java.time.LocalDateTime.now())
                .build();
        notificationMedecinRepository.save(notif);
    }

    /**
     * Alerte critique labo (hyperkaliémie, DFG bas, etc.) — affichée sur le dashboard médecin.
     */
    public void creerPourAlerteLabo(Long idMedecin, Long idDossierMedical, Long idResultatLaboratoire,
                                    String nomPatient, String message) {
        NotificationMedecin notif = NotificationMedecin.builder()
                .idMedecin(idMedecin)
                .idDossierMedical(idDossierMedical)
                .patientName(nomPatient != null ? nomPatient : "Patient")
                .type(TypeNotificationMedecin.ALERTE_LABO)
                .titre("Alerte labo critique")
                .message(message != null ? message : "Résultat critique à valider")
                .idResultatLaboratoire(idResultatLaboratoire)
                .lu(false)
                .dateCreation(java.time.LocalDateTime.now())
                .build();
        notificationMedecinRepository.save(notif);
    }

    /**
     * Crée une alerte pour le médecin quand un patient n'a pas pris son médicament.
     * Peut être appelé par le service prescription (8086) ou par un job planifié.
     */
    public void creerPourMedicamentNonPris(Long idMedecin, Long idDossierMedical,
                                           Long idPatient, String nomPatient,
                                           String nomMedicament, String datePrise) {
        String titre = "Médicament non pris";
        String message = String.format("Le patient %s n'a pas pris son médicament « %s » (%s).",
                nomPatient != null && !nomPatient.isBlank() ? nomPatient : "Patient #" + idPatient,
                nomMedicament != null && !nomMedicament.isBlank() ? nomMedicament : "—",
                datePrise != null ? datePrise : "—");
        NotificationMedecin notif = NotificationMedecin.builder()
                .idMedecin(idMedecin)
                .idDossierMedical(idDossierMedical)
                .idPatient(idPatient)
                .patientName(nomPatient)
                .type(TypeNotificationMedecin.MEDICAMENT_NON_PRIS)
                .titre(titre)
                .message(message)
                .idResultatLaboratoire(null)
                .lu(false)
                .dateCreation(java.time.LocalDateTime.now())
                .build();
        notificationMedecinRepository.save(notif);
    }

    @Transactional(readOnly = true)
    public List<NotificationMedecinDTO> getByMedecin(Long idMedecin) {
        return notificationMedecinRepository.findByIdMedecinOrderByDateCreationDesc(idMedecin)
                .stream()
                .map(NotificationMedecinService::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NotificationMedecinDTO> getNonLuesByMedecin(Long idMedecin) {
        return notificationMedecinRepository.findByIdMedecinAndLuFalseOrderByDateCreationDesc(idMedecin)
                .stream()
                .map(NotificationMedecinService::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long countNonLuesByMedecin(Long idMedecin) {
        return notificationMedecinRepository.countByIdMedecinAndLuFalse(idMedecin);
    }

    public void marquerCommeLu(Long idNotification) {
        notificationMedecinRepository.findById(idNotification).ifPresent(n -> {
            n.setLu(true);
            notificationMedecinRepository.save(n);
        });
    }

    public void marquerToutesCommeLues(Long idMedecin) {
        notificationMedecinRepository.findByIdMedecinAndLuFalseOrderByDateCreationDesc(idMedecin)
                .forEach(n -> {
                    n.setLu(true);
                    notificationMedecinRepository.save(n);
                });
    }
}
