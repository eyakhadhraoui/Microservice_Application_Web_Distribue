/**
 * Noms canoniques des rôles Keycloak (realm) : patient, medecin.
 * hasRole() reste insensible à la casse tant que d’anciens rôles Patient/Medecin existent encore dans le realm.
 */
export const KEYCLOAK_ROLES = {
  medecin: 'medecin',
  patient: 'patient',
} as const;

export type KeycloakRole = (typeof KEYCLOAK_ROLES)[keyof typeof KEYCLOAK_ROLES];
