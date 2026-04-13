import { Injectable } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import Keycloak from 'keycloak-js';
import { keycloakConfig } from './keycloak-config';
import { decodeJwtPayload, isJwtExpired } from './jwt-helper';

/** URL relative : le proxy (proxy.conf.json) redirige /api vers le backend → pas de CORS. */
const LOGIN_API = '/api/auth/login';
const REFRESH_API = '/api/auth/refresh';

/** Stockage localStorage (DevTools → Application → Local Storage). */
export const AUTH_LS_ACCESS = 'access_token';
export const AUTH_LS_REFRESH = 'refresh_token';
export const AUTH_LS_EXPIRES_AT = 'access_token_expires_at';

function browserLocalStorage(): Storage | null {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
    ? localStorage
    : null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private keycloak: Keycloak | null = null;
  private initPromise: Promise<boolean> | null = null;
  /** Copie mémoire du jeton formulaire (synchronisée avec localStorage). */
  private storedToken: string | null = null;
  /** Client HTTP sans intercepteurs (évite boucle sur /api/auth/refresh). */
  private readonly httpRaw: HttpClient;
  private refreshPromise: Promise<void> | null = null;

  constructor(
    private http: HttpClient,
    httpBackend: HttpBackend,
  ) {
    this.httpRaw = new HttpClient(httpBackend);
  }

  /** Initialise Keycloak. À appeler une seule fois (APP_INITIALIZER). */
  init(): Promise<boolean> {
    if (this.initPromise) return this.initPromise;
    this.keycloak = new Keycloak({
      url: keycloakConfig.url,
      realm: keycloakConfig.realm,
      clientId: keycloakConfig.clientId,
    });
    const initOptions = {
      checkLoginIframe: false,
    };
    this.initPromise = this.keycloak
      .init(initOptions)
      .then((authenticated) => {
        if (authenticated) {
          this.clearPersistedFormTokensOnly();
        } else {
          this.loadPersistedAccessToken();
        }
        return authenticated;
      })
      .catch((err) => {
        console.warn("Keycloak non disponible, l'app s'affiche sans authentification:", err);
        this.loadPersistedAccessToken();
        return false;
      });
    return this.initPromise;
  }

  /** Connexion par redirection vers Keycloak (SSO). */
  login(redirectUri?: string): Promise<void> {
    if (!this.keycloak) return Promise.reject(new Error('Keycloak non initialisé'));
    return this.keycloak.login({ redirectUri: redirectUri || window.location.href });
  }

  /**
   * Connexion formulaire : POST /api/auth/login → stocke access_token, refresh_token, expiry (localStorage).
   */
  loginWithCredentials(username: string, password: string): Promise<void> {
    return firstValueFrom(
      this.http.post<Record<string, unknown>>(LOGIN_API, { username, password }),
    )
      .then((res) => {
        if (this.applyTokenResponse(res)) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('Token manquant'));
      })
      .catch((err) => {
        const raw = err?.error;
        let msg: string | null = null;
        if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) {
          const m = (raw as Record<string, unknown>)['message'];
          if (typeof m === 'string') msg = m;
        } else if (typeof raw === 'string' && raw.length > 0) {
          msg = raw.length > 280 ? raw.slice(0, 280) + '…' : raw;
        }
        const st = err?.status as number | undefined;
        let fallback: string | null = null;
        if (st === 0)
          fallback =
            'Réseau : vérifiez la Gateway (8095) et le user-service Symfony (http://127.0.0.1:8000).';
        else if (st === 503)
          fallback =
            'Keycloak injoignable ou erreur token (voir le corps JSON de la réponse). Vérifiez KEYCLOAK_BASE_URL et que Keycloak tourne.';
        else if (st === 502 || st === 504)
          fallback =
            'Passerelle ou service indisponible (502/504). Gateway 8095 et Symfony http://127.0.0.1:8000.';
        else if (st === 500)
          fallback =
            'Erreur serveur (500). Ouvrez Network → login → Response. Test : http://127.0.0.1:8000/api/auth/ping';

        const finalMsg =
          msg ??
          (typeof err?.message === 'string' ? err.message : null) ??
          fallback ??
          'Erreur de connexion.';
        return Promise.reject({
          ...err,
          message: finalMsg,
          error: { ...(err?.error ?? {}), message: finalMsg },
        });
      });
  }

  /**
   * Avant les appels API : rafraîchit le jeton SSO ou le couple access/refresh (login formulaire).
   */
  async ensureValidAccessToken(): Promise<void> {
    if (this.keycloak?.authenticated && this.keycloak.token) {
      try {
        await this.keycloak.updateToken(60);
      } catch {
        /* SSO expiré : tenter jeton formulaire / refresh ci-dessous */
      }
    }
    if (this.getToken()) {
      return;
    }
    await this.tryRefreshWithStoredRefreshToken();
  }

  clearStoredToken(): void {
    this.clearPersistedTokens();
  }

  logout(redirectUri?: string): Promise<void> {
    this.clearPersistedTokens();
    if (this.keycloak?.authenticated) {
      return this.keycloak.logout({ redirectUri: redirectUri || window.location.origin + '/' });
    }
    return Promise.resolve();
  }

  /** JWT pour Bearer : SSO Keycloak actif, sinon jeton formulaire (mémoire / localStorage). */
  getToken(): string | null {
    if (
      this.keycloak?.authenticated &&
      this.keycloak?.token &&
      !isJwtExpired(this.keycloak.token)
    ) {
      return this.keycloak.token;
    }
    if (this.storedToken && !isJwtExpired(this.storedToken)) {
      return this.storedToken;
    }
    const fromLs = this.readValidAccessTokenFromLocalStorage();
    if (fromLs) {
      this.storedToken = fromLs;
      return fromLs;
    }
    this.storedToken = null;
    return null;
  }

  /**
   * Connecté si session Keycloak valide ou jeton formulaire présent, non expiré (JWT `exp` ou `access_token_expires_at`).
   */
  isLoggedIn(): boolean {
    if (this.keycloak?.authenticated && this.keycloak?.token) {
      if (!isJwtExpired(this.keycloak.token)) return true;
    }
    const ls = browserLocalStorage();
    const raw = ls?.getItem(AUTH_LS_ACCESS);
    const refresh = (ls?.getItem(AUTH_LS_REFRESH) ?? '').trim();

    if (raw && !isJwtExpired(raw)) {
      if (this.isExpiredByStoredDeadline(ls)) {
        if (!refresh) {
          this.clearPersistedTokens();
          return false;
        }
        return true;
      }
      if (!this.storedToken) this.storedToken = raw;
      return true;
    }

    if (raw && isJwtExpired(raw) && refresh) {
      return true;
    }

    if (raw && isJwtExpired(raw) && !refresh) {
      this.clearPersistedTokens();
      return false;
    }

    if (!raw && refresh) {
      return true;
    }

    return false;
  }

  updateToken(minValidity = 5): Promise<boolean> {
    if (!this.keycloak) return Promise.resolve(false);
    return this.keycloak.updateToken(minValidity);
  }

  getProfile(): { username?: string; email?: string; name?: string; [key: string]: unknown } | null {
    const p = this.getTokenPayload();
    if (!p) return null;
    return {
      username: (p['preferred_username'] as string) ?? (p['sub'] as string),
      email: (p['email'] as string) ?? '',
      name: (p['name'] as string) ?? (p['given_name'] as string) ?? '',
    };
  }

  private getTokenPayload(): Record<string, unknown> | null {
    const t = this.getToken();
    if (t) return decodeJwtPayload(t);
    if (this.keycloak?.tokenParsed) return this.keycloak.tokenParsed as Record<string, unknown>;
    return null;
  }

  getRealmRoles(): string[] {
    const p = this.getTokenPayload();
    if (!p || !p['realm_access']) return [];
    const realmAccess = p['realm_access'] as { roles?: string[] };
    return realmAccess?.roles ?? [];
  }

  getResourceRoles(): string[] {
    const p = this.getTokenPayload();
    if (!p) return [];
    const ra = p['resource_access'] as Record<string, { roles?: string[] }> | undefined;
    if (!ra) return [];
    const client = ra[keycloakConfig.clientId];
    return client?.roles ?? [];
  }

  hasRole(roles: string[]): boolean {
    const realm = this.getRealmRoles();
    const resource = this.getResourceRoles();
    const allLower = [...realm, ...resource].map((r) => r.toLowerCase());
    return roles.some((r) => allLower.includes(r.toLowerCase()));
  }

  getKeycloak(): Keycloak | null {
    return this.keycloak;
  }

  /** Applique la réponse Keycloak (login ou refresh). Retourne false si access_token absent. */
  private applyTokenResponse(res: Record<string, unknown>): boolean {
    const access =
      (typeof res?.['access_token'] === 'string' && res['access_token']) ||
      (typeof res?.['accessToken'] === 'string' && res['accessToken']) ||
      '';
    if (!access) {
      return false;
    }
    const refreshRaw = res?.['refresh_token'] ?? res?.['refreshToken'];
    const ls = browserLocalStorage();
    const nextRefresh =
      typeof refreshRaw === 'string' && refreshRaw.length > 0
        ? refreshRaw
        : ls?.getItem(AUTH_LS_REFRESH) ?? undefined;
    const expRaw = res?.['expires_in'] ?? res?.['expiresIn'];
    let expiresIn: number | undefined;
    if (typeof expRaw === 'number' && expRaw > 0) expiresIn = expRaw;
    else if (typeof expRaw === 'string') {
      const n = parseInt(expRaw, 10);
      if (!isNaN(n) && n > 0) expiresIn = n;
    }
    this.persistTokens(access, nextRefresh, expiresIn);
    return true;
  }

  private async tryRefreshWithStoredRefreshToken(): Promise<void> {
    const ls = browserLocalStorage();
    const refresh = ls?.getItem(AUTH_LS_REFRESH)?.trim();
    if (!refresh) {
      return;
    }

    if (this.refreshPromise) {
      await this.refreshPromise;
      return;
    }

    this.refreshPromise = (async () => {
      try {
        const res = await firstValueFrom(
          this.httpRaw.post<Record<string, unknown>>(REFRESH_API, { refresh_token: refresh }),
        );
        if (!this.applyTokenResponse(res)) {
          this.clearPersistedTokens();
        }
      } catch {
        this.clearPersistedTokens();
      } finally {
        this.refreshPromise = null;
      }
    })();

    await this.refreshPromise;
  }

  private persistTokens(access: string, refresh?: string, expiresInSec?: number): void {
    this.storedToken = access;
    const ls = browserLocalStorage();
    if (!ls) return;
    ls.setItem(AUTH_LS_ACCESS, access);
    if (refresh) ls.setItem(AUTH_LS_REFRESH, refresh);
    else ls.removeItem(AUTH_LS_REFRESH);

    let expiresAtMs: number;
    if (typeof expiresInSec === 'number' && expiresInSec > 0) {
      expiresAtMs = Date.now() + expiresInSec * 1000;
    } else {
      const p = decodeJwtPayload(access);
      const exp = p['exp'];
      expiresAtMs = typeof exp === 'number' ? exp * 1000 : Date.now() + 300_000;
    }
    ls.setItem(AUTH_LS_EXPIRES_AT, String(expiresAtMs));
  }

  private clearPersistedTokens(): void {
    this.storedToken = null;
    const ls = browserLocalStorage();
    if (ls) {
      ls.removeItem(AUTH_LS_ACCESS);
      ls.removeItem(AUTH_LS_REFRESH);
      ls.removeItem(AUTH_LS_EXPIRES_AT);
    }
  }

  /** SSO Keycloak : retirer les jetons « formulaire » du disque pour éviter les mélanges. */
  private clearPersistedFormTokensOnly(): void {
    this.storedToken = null;
    const ls = browserLocalStorage();
    if (ls) {
      ls.removeItem(AUTH_LS_ACCESS);
      ls.removeItem(AUTH_LS_REFRESH);
      ls.removeItem(AUTH_LS_EXPIRES_AT);
    }
  }

  private loadPersistedAccessToken(): void {
    const ls = browserLocalStorage();
    if (!ls) return;
    const raw = ls.getItem(AUTH_LS_ACCESS);
    if (!raw) return;
    if (isJwtExpired(raw) || this.isExpiredByStoredDeadline(ls)) {
      this.clearPersistedTokens();
      return;
    }
    this.storedToken = raw;
  }

  private readValidAccessTokenFromLocalStorage(): string | null {
    const ls = browserLocalStorage();
    if (!ls) return null;
    const raw = ls.getItem(AUTH_LS_ACCESS);
    if (!raw || isJwtExpired(raw) || this.isExpiredByStoredDeadline(ls)) return null;
    return raw;
  }

  private isExpiredByStoredDeadline(ls: Storage | null = browserLocalStorage()): boolean {
    if (!ls) return true;
    const raw = ls.getItem(AUTH_LS_EXPIRES_AT);
    if (!raw) return false;
    const t = parseInt(raw, 10);
    if (isNaN(t)) return false;
    return Date.now() >= t - 60_000;
  }
}
