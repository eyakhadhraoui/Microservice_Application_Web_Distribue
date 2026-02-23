package com.example.NEPHRO.Enum;


public enum StatutSuivi {
    EN_COURS("En cours de traitement"),
    STABLE("État stable"),
    AMELIORATION("Amélioration"),
    DETERIORATION("Détérioration"),
    REMISSION("Rémission"),
    RECHUTE("Rechute"),
    GUERISON("Guérison"),
    SOUS_SURVEILLANCE("Sous surveillance"),
    HOSPITALISATION_REQUISE("Hospitalisation requise"),
    URGENCE("Urgence"),
    TRAITEMENT_MODIFIE("Traitement modifié"),
    COMPLIANCE_FAIBLE("Compliance faible au traitement"),
    COMPLIANCE_BONNE("Bonne compliance"),
    ATTENTE_RESULTATS("En attente de résultats"),
    CONSULTATION_SPECIALISEE_REQUISE("Consultation spécialisée requise"),
    GREFFE_EN_ATTENTE("Greffe en attente"),
    POST_OPERATOIRE("Post-opératoire"),
    SUIVI_TERMINE("Suivi terminé"),
    PERDU_DE_VUE("Perdu de vue"),
    DECES("Décès");

    private final String libelle;

    StatutSuivi(String libelle) {
        this.libelle = libelle;
    }

    public String getLibelle() {
        return libelle;
    }
}