package org.example.infectionetvaccination.Enum;

/**
 * Types de notifications affichées sur le dashboard médecin.
 */
public enum TypeNotificationMedecin {
    /** Un patient a ajouté un nouveau résultat de test laboratoire. */
    NOUVEAU_TEST_LABO,
    /** Un patient n'a pas pris son médicament (observance). */
    MEDICAMENT_NON_PRIS,
    /** Alerte critique labo (kaliémie, DFG, protéinurie, hyponatrémie). */
    ALERTE_LABO
}
