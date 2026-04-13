import { AuthService } from './auth.service';

/**
 * Initialisation de l'app : Keycloak doit être initialisé avant le bootstrap Angular.
 * Utilisé dans APP_INITIALIZER.
 */
export function initializeAuth(auth: AuthService): () => Promise<boolean> {
  return () => auth.init();
}
