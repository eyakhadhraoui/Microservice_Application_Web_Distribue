package com.example.dossiermedicale.Enum;

/**
 * Catalogue des tests laboratoire pour la néphrologie pédiatrique.
 * Nom, catégorie, code LOINC, unité. Utilisé pour initialiser la table test_laboratoire.
 */
public enum TypeTestLaboratoire {

    // ——— Biochimie rénale / Fonction rénale ———
    CREATININEMIE("Créatininémie", "Biochimie rénale", "2160-0", "µmol/L"),
    DFG_ESTIME_SCHWARTZ("DFG estimé (Schwartz)", "Biochimie rénale", "48642-3", "mL/min/1.73m²"),
    UREE("Urée", "Biochimie rénale", "3094-0", "mmol/L"),
    ACIDE_URIQUE("Acide urique", "Biochimie rénale", "3084-1", "µmol/L"),
    CYSTATINE_C("Cystatine C", "Biochimie rénale", "33914-3", "mg/L"),
    DFG_CYSTATINE_C("DFG cystatine C", "Biochimie rénale", "76633-7", "mL/min/1.73m²"),

    // ——— Électrolytes / Ionogramme ———
    NATREMIE("Natrémie", "Électrolytes", "2951-2", "mmol/L"),
    KALIEMIE("Kaliémie", "Électrolytes", "2823-3", "mmol/L"),
    CHLOREMIE("Chloremie", "Électrolytes", "2075-0", "mmol/L"),
    BICARBONATES("Bicarbonates", "Électrolytes", "1963-8", "mmol/L"),
    PHOSPHOREMIE("Phosphorémie", "Électrolytes", "2777-1", "mmol/L"),
    CALCEMIE("Calcémie", "Électrolytes", "2000-8", "mmol/L"),
    CALCEMIE_CORRIGEE("Calcémie corrigée", "Électrolytes", "2000-8", "mmol/L"),
    MAGNESEMIE("Magnésémie", "Électrolytes", "2601-3", "mmol/L"),

    // ——— Métabolisme osseux / Bilan phospho-calcique ———
    PTH("PTH", "Métabolisme osseux", "2731-8", "pg/mL"),
    VITAMINE_D_25OH("Vitamine D (25-OH)", "Métabolisme osseux", "35365-6", "nmol/L"),
    VITAMINE_D_1_25OH("Vitamine D (1-25-OH)", "Métabolisme osseux", "1989-3", "pmol/L"),
    FGF23("FGF23", "Métabolisme osseux", null, "pg/mL"),

    // ——— Autres (existants) ———
    NFS("NFS", "Hématologie", null, null),
    HEMOGLOBINE("Hémoglobine", "Hématologie", "718-7", "g/L"),
    ALBUMINEMIE("Albuminémie", "Biochimie", "1751-7", "g/L"),
    PROTEINURIE("Protéinurie", "Urinaire", "2888-6", "g/g créat"),
    ELECTROPHORESE_PROTEINES("Électrophorèse des protéines", "Immunologie", null, null),
    BILAN_HEPATIQUE("Bilan hépatique", "Biochimie", null, null),
    GLYCEMIE("Glycémie", "Biochimie", null, null),
    CRP("CRP", "Inflammation", null, null),
    HEMATURIE("Hématurie", "Urinaire", null, null),
    CULTURE_URINE("Culture d'urine", "Microbiologie", null, null),
    AUTRE("Autre", "Autre", null, null);

    private final String nom;
    private final String categorie;
    private final String codeLoinc;
    private final String unite;

    TypeTestLaboratoire(String nom, String categorie, String codeLoinc, String unite) {
        this.nom = nom;
        this.categorie = categorie;
        this.codeLoinc = codeLoinc;
        this.unite = unite;
    }

    public String getNom() {
        return nom;
    }

    public String getCategorie() {
        return categorie;
    }

    public String getCodeLoinc() {
        return codeLoinc;
    }

    public String getUnite() {
        return unite;
    }

    /** Code du test (nom de l'enum) pour codeTest en base. */
    public String getCode() {
        return name();
    }
}
