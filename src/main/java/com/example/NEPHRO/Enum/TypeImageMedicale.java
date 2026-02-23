package com.example.NEPHRO.Enum;



public enum TypeImageMedicale {
    // Échographie
    ECHOGRAPHIE_RENALE("Échographie rénale"),
    ECHOGRAPHIE_VESICALE("Échographie vésicale"),
    ECHOGRAPHIE_DOPPLER_RENAL("Échographie Doppler rénal"),
    ECHOGRAPHIE_ABDOMINALE("Échographie abdominale"),
    ECHOGRAPHIE_PELVIENNE("Échographie pelvienne"),

    // Scanner (TDM)
    SCANNER_ABDOMINAL("Scanner abdominal"),
    SCANNER_RENAL("Scanner rénal"),
    URO_SCANNER("Uro-scanner"),
    SCANNER_SANS_INJECTION("Scanner sans injection"),
    SCANNER_AVEC_INJECTION("Scanner avec injection"),

    // IRM
    IRM_RENALE("IRM rénale"),
    IRM_ABDOMINALE("IRM abdominale"),
    IRM_PELVIENNE("IRM pelvienne"),
    URO_IRM("Uro-IRM"),
    IRM_AVEC_GADOLINIUM("IRM avec gadolinium"),

    // Radiologie
    RADIOGRAPHIE_ABDOMINALE("Radiographie abdominale"),
    ASP("Abdomen sans préparation (ASP)"),
    UIV("Urographie intraveineuse (UIV)"),

    // Scintigraphie
    SCINTIGRAPHIE_RENALE_STATIQUE("Scintigraphie rénale statique (DMSA)"),
    SCINTIGRAPHIE_RENALE_DYNAMIQUE("Scintigraphie rénale dynamique (MAG3/DTPA)"),

    // Cystographie
    CYSTOGRAPHIE_RETRO_MICTIONNELLE("Cystographie rétrograde et mictionnelle"),
    CYSTOGRAPHIE_ISOTOPIQUE("Cystographie isotopique"),

    // Autres
    RADIOGRAPHIE_THORACIQUE("Radiographie thoracique"),
    DENSITOMETRIE_OSSEUSE("Densitométrie osseuse"),
    PHOTO_CLINIQUE("Photo clinique"),
    RAPPORT_RADIOLOGIQUE("Rapport radiologique"),

    AUTRE("Autre type d'image");

    private final String libelle;

    TypeImageMedicale(String libelle) {
        this.libelle = libelle;
    }

    public String getLibelle() {
        return libelle;
    }
}