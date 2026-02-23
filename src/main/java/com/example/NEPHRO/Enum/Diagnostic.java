package com.example.NEPHRO.Enum;


public enum Diagnostic {
    // Infections urinaires
    INFECTION_URINAIRE("Infection urinaire"),
    PYELONEPHRITE("Pyélonéphrite aiguë"),
    CYSTITE("Cystite"),

    // Malformations congénitales
    REFLUX_VESICO_URETERAL("Reflux vésico-urétéral"),
    HYDRONEPHROSE("Hydronéphrose"),
    UROPATHIE_OBSTRUCTIVE("Uropathie obstructive"),
    DYSPLASIE_RENALE("Dysplasie rénale"),
    HYPOPLASIE_RENALE("Hypoplasie rénale"),
    REIN_UNIQUE("Rein unique"),
    POLYKYSTOSE_RENALE("Polykystose rénale"),

    // Syndromes néphrotiques
    SYNDROME_NEPHROTIQUE("Syndrome néphrotique"),
    SYNDROME_NEPHROTIQUE_CORTICOSENSIBLE("Syndrome néphrotique corticosensible"),
    SYNDROME_NEPHROTIQUE_CORTICORESISTANT("Syndrome néphrotique corticorésistant"),
    SYNDROME_NEPHROTIQUE_CONGENITAL("Syndrome néphrotique congénital"),

    // Glomérulopathies
    GLOMERULONEPHRITE_AIGUE("Glomérulonéphrite aiguë post-infectieuse"),
    GLOMERULONEPHRITE_CHRONIQUE("Glomérulonéphrite chronique"),
    PURPURA_RHUMATOIDE("Purpura rhumatoïde (HSP)"),
    LUPUS_NEPHRITE("Lupus néphrite"),
    SYNDROME_ALPORT("Syndrome d'Alport"),

    // Tubulopathies
    TUBULOPATHIE_PROXIMALE("Tubulopathie proximale"),
    ACIDOSE_TUBULAIRE_RENALE("Acidose tubulaire rénale"),
    SYNDROME_DE_FANCONI("Syndrome de Fanconi"),
    DIABETE_INSIPIDE_NEPHROGINIQUE("Diabète insipide néphrogénique"),
    SYNDROME_DE_BARTTER("Syndrome de Bartter"),
    SYNDROME_DE_GITELMAN("Syndrome de Gitelman"),

    // Insuffisance rénale
    INSUFFISANCE_RENALE_AIGUE("Insuffisance rénale aiguë"),
    INSUFFISANCE_RENALE_CHRONIQUE("Insuffisance rénale chronique"),
    MALADIE_RENALE_CHRONIQUE_STADE_1("Maladie rénale chronique stade 1"),
    MALADIE_RENALE_CHRONIQUE_STADE_2("Maladie rénale chronique stade 2"),
    MALADIE_RENALE_CHRONIQUE_STADE_3("Maladie rénale chronique stade 3"),
    MALADIE_RENALE_CHRONIQUE_STADE_4("Maladie rénale chronique stade 4"),
    MALADIE_RENALE_CHRONIQUE_STADE_5("Maladie rénale chronique stade 5"),

    // Hypertension
    HYPERTENSION_ARTERIELLE("Hypertension artérielle"),
    HYPERTENSION_RENOVASCULAIRE("Hypertension rénovasculaire"),

    // Lithiases
    LITHIASE_RENALE("Lithiase rénale"),
    NEPHROCALCINOSE("Néphrocalcinose"),

    // Hématurie
    HEMATURIE_MACROSCOPIQUE("Hématurie macroscopique"),
    HEMATURIE_MICROSCOPIQUE("Hématurie microscopique"),

    // Protéinurie
    PROTEINURIE_ISOLEE("Protéinurie isolée"),
    PROTEINURIE_ORTHOSTATIQUE("Protéinurie orthostatique"),

    // Énurésie
    ENURESIE_PRIMAIRE("Énurésie primaire"),
    ENURESIE_SECONDAIRE("Énurésie secondaire"),
    VESSIE_NEUROLOGIQUE("Vessie neurologique"),

    // Syndromes
    SYNDROME_HEMOLYTIQUE_UREMIQUE("Syndrome hémolytique et urémique (SHU)"),
    MALADIE_DE_BERGER("Maladie de Berger (néphropathie à IgA)"),

    // Transplantation
    POST_TRANSPLANTATION_RENALE("Post-transplantation rénale"),
    REJET_DE_GREFFE("Rejet de greffe rénale"),

    AUTRE("Autre diagnostic");

    private final String libelle;

    Diagnostic(String libelle) {
        this.libelle = libelle;
    }

    public String getLibelle() {
        return libelle;
    }
}