import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { KEYCLOAK_ROLES } from './keycloak-roles';

/**
 * Toute l’app sauf /login et /register : exige un jeton valide (localStorage ou Keycloak SSO).
 */
export const requireAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  router.navigate(['/login']);
  return false;
};

/**
 * Guard : protège les routes qui nécessitent une connexion Keycloak.
 * Redirige vers la page de login Keycloak si non authentifié.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isLoggedIn()) return true;
  auth.login(window.location.origin + '/home');
  return false;
};

/**
 * Guard optionnel : exige un des rôles donnés (realm ou client).
 * Utilisation : canActivate: [roleGuard(['medecin', 'admin'])]
 */
export function roleGuard(roles: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isLoggedIn()) {
      auth.login(window.location.origin + '/home');
      return false;
    }
    if (auth.hasRole(roles)) return true;
    router.navigate(['/home']);
    return false;
  };
}

/**
 * Guard front office : réservé au rôle patient.
 * Si l'utilisateur est médecin, redirection vers le back office (/back).
 * Si non connecté, redirection vers la page de login (/login).
 */
export const patientAreaGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }
  if (auth.hasRole([KEYCLOAK_ROLES.medecin])) {
    router.navigate(['/back']);
    return false;
  }
  if (auth.hasRole([KEYCLOAK_ROLES.patient])) return true;
  router.navigate(['/home']);
  return false;
};

/**
 * Guard back office : réservé au rôle médecin.
 * Si l'utilisateur est patient, redirection vers le front office (/home).
 * Si non connecté, redirection vers la page de login (/login).
 */
export const medecinAreaGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }
  if (auth.hasRole([KEYCLOAK_ROLES.patient])) {
    router.navigate(['/home']);
    return false;
  }
  if (auth.hasRole([KEYCLOAK_ROLES.medecin])) return true;
  router.navigate(['/home']);
  return false;
};
