package com.example.dossiermedicale.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Réponse de l'endpoint OCR : texte extrait et éventuel message d'erreur (ex. Tesseract non configuré). */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OcrResponse {
    private String text;
    /** Présent si l'OCR a échoué (ex. Tesseract non installé). À afficher à l'utilisateur. */
    private String error;
}
