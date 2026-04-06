package com.example.dossiermedicale.Services;

import com.example.dossiermedicale.dto.NotificationPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Envoie les notifications temps réel aux patients via WebSocket (STOMP).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationWebSocketService {

    private static final String TOPIC_PATIENT_PREFIX = "/topic/patient/";

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Notifie le patient qu'une nouvelle image médicale a été ajoutée à son dossier.
     */
    public void notifyPatientNewImage(Long idPatient, String typeImageLibelle, java.time.LocalDate dateCapture,
                                      Long idDossierMedical, Long idImage) {
        if (idPatient == null) return;
        NotificationPayload payload = new NotificationPayload(
                NotificationPayload.TYPE_IMAGE_MEDICALE,
                "Nouvelle image médicale : " + (typeImageLibelle != null ? typeImageLibelle : "Image"),
                dateCapture,
                idDossierMedical,
                idImage
        );
        String destination = TOPIC_PATIENT_PREFIX + idPatient;
        try {
            messagingTemplate.convertAndSend(destination, payload);
            log.info("Notification WebSocket envoyée au patient {} : nouvelle image {}", idPatient, idImage);
        } catch (Exception e) {
            log.warn("Échec envoi notification WebSocket au patient {}: {}", idPatient, e.getMessage());
        }
    }
}
