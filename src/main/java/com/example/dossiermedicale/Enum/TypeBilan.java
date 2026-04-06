package com.example.dossiermedicale.Enum;

/**
 * Types de bilan prescrits (codes LOINC / libellés courants).
 */
public enum TypeBilan {
    RENAL_COMPLET("Bilan rénal complet"),
    IONOGRAMME("Ionogramme sanguin"),
    PROTEINURIE("Protéinurie"),
    NFS("Numération formule sanguine"),
    DMSA("Scintigraphie DMSA"),
    CREATININE("Créatininémie"),
    UREE("Urée"),
    KALIEMIE("Kaliémie"),
    NATREMIE("Natrémie"),
    BICARBONATES("Bicarbonates"),
    HEMOGLOBINE("Hémoglobine"),
    DFG("DFG estimé"),
    AUTRE("Autre");

    private final String libelle;

    TypeBilan(String libelle) {
        this.libelle = libelle;
    }

    public String getLibelle() {
        return libelle;
    }
}
