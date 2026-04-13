/**
 * Aligné sur le realm exporté Keycloak : kidneyCare-realm, client public kidneycare-app
 * (Direct Access Grants + Standard Flow, redirect http://localhost:4200/*).
 */
export const keycloakConfig = {
  /** Même port que docker-compose (Keycloak mappé 8081→8080 si 8080 est pris sur Windows) */
  url: 'http://localhost:8081',
  realm: 'kidneyCare-realm',
  /** Doit être identique à KEYCLOAK_CLIENT_ID côté Symfony (.env) */
  clientId: 'kidneycare-app',
};

export type KeycloakConfig = typeof keycloakConfig;
