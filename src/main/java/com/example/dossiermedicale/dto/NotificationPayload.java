package com.example.dossiermedicale.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Payload envoyé au patient via WebSocket (nouvelle image médicale, etc.).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPayload {

    public static final String TYPE_IMAGE_MEDICALE = "IMAGE_MEDICALE";
    public static final String TYPE_SUIVI = "SUIVI";

    private String type;
    private String titre;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate date;
    private Long idDossierMedical;
    private Long idItem;
}
