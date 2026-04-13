# Keycloak — Angular + Symfony user-service

**Valeurs alignées dans ce dépôt :** Keycloak `http://localhost:8080`, realm **`kidneyCare-realm`**, client **`kidneycare-app`**, Symfony user-service **`http://127.0.0.1:8000`**, Angular **`http://localhost:4200`**. Si Keycloak tourne sur un autre port (ex. 8180), mettez **la même URL** dans `keycloak-config.ts`, `.env` Symfony et la Gateway (`issuer-uri`).

## 1. Realm roles (indispensable pour l’inscription)

Dans **Realm roles**, le nom doit être exactement en **minuscules** :

| Rôle     | Usage |
|----------|--------|
| **`patient`**  | Assigné automatiquement à l’inscription (`KeycloakPatientAdminService`). **Sans ce rôle, l’API admin échoue.** |
| **`medecin`**  | Comptes médecin (back-office). |

Supprimez les doublons **Patient** / **Medecin** en majuscules si vous les aviez créés (voir section plus bas).

## 2. Client `kidneycare-app`

- **Client authentication** : OFF (public), sauf si vous avez un setup différent.
- **Direct access grants** : **ON** — requis pour `POST /api/auth/login` (mot de passe depuis le formulaire).
- **Valid redirect URIs** : `http://localhost:4200/*`
- **Web origins** : `http://localhost:4200` (ou `+`)

## 3. Compte admin Keycloak (inscription `POST /api/auth/register`)

L’inscription utilise l’API **admin** avec un utilisateur du realm **`master`** (souvent **admin**). Variables dans `dosiersymfony/user-service/.env` :

- `KEYCLOAK_ADMIN_USERNAME` / `KEYCLOAK_ADMIN_PASSWORD` — doivent permettre de se connecter à la console d’admin Keycloak (realm master).

## 4. Utilisateur test : Role mapping

- Onglet **Role mapping** → **Assign role** :
   - Pour un **patient** : sélectionner le rôle **patient** (realm role).
   - Pour un **médecin** : sélectionner le rôle **medecin** (realm role).

Créez au moins un utilisateur avec le rôle `patient` et un avec le rôle `medecin` pour tester.

### Rôles : supprimer les doublons `Patient` / `Medecin` (majuscules)

Le realm ne doit exposer dans les JWT que les rôles realm **`patient`** et **`medecin`** (tout en minuscules), comme le fait déjà l’inscription Symfony (`KeycloakPatientAdminService` → rôle `patient`).

1. **Admin Keycloak** → realm **kidneyCare-realm** → **Users** : pour chaque utilisateur, onglet **Role mapping** → retirez (**Unassign**) les rôles realm **Patient** et **Medecin** s’ils sont présents ; assignez **patient** ou **medecin** selon le besoin.
2. Lorsqu’aucun utilisateur n’a plus **Patient** ni **Medecin** : **Realm roles** → sélectionnez le rôle **Patient** → menu **Delete** ; idem pour **Medecin**.

Sans cette étape, le token peut contenir les deux variantes ; l’app Angular tolère encore la casse via `hasRole()`, mais les JWT et les audits sont plus simples sans doublons.

---

## 6. Vérifier la configuration Angular

Fichier `src/app/auth/keycloak-config.ts` :

```ts
export const keycloakConfig = {
  url: 'http://localhost:8080',
  realm: 'kidneyCare-realm',
  clientId: 'kidneycare-app',
};
```

En production, remplacez les URLs par celles de votre domaine.

---

## 7. Comportement des routes

| Zone           | Rôle requis | Routes              | Comportement si mauvais rôle      |
|----------------|------------|---------------------|-----------------------------------|
| **Front office** | patient  | `/home`, `/home/treatment`, `/home/history` | Médecin → redirigé vers `/back` |
| **Back office**  | medecin  | `/back`, `/back/dossiers`, `/back/dashboard`, `/back/users` | Patient → redirigé vers `/home` |

- **Non connecté** : en allant sur `/home` ou `/back`, l’utilisateur est envoyé sur la page de connexion Keycloak, puis renvoyé vers `/home` après login.
- **Token** : l’intercepteur HTTP envoie le token Keycloak (Bearer) à votre API (`localhost:8089`). Côté backend, valider le JWT Keycloak (issuer, audience, realm, rôles).

---

## 8. Fichiers créés ou modifiés dans le projet

- `src/app/auth/keycloak-config.ts` — configuration Keycloak
- `src/app/auth/keycloak-roles.ts` — constantes des rôles `medecin` / `patient`
- `src/app/auth/auth.service.ts` — init, login, logout, rôles, token
- `src/app/auth/auth.guard.ts` — `authGuard`, `patientAreaGuard`, `medecinAreaGuard`
- `src/app/auth/app-init.ts` — initialisation au démarrage (APP_INITIALIZER)
- `src/app/auth/auth.interceptor.class.ts` — ajout du Bearer token aux requêtes HTTP
- `src/app/app-module.ts` — APP_INITIALIZER + HTTP_INTERCEPTORS
- `src/app/app-routing-module.ts` — guards sur `/home` (patient) et `/back` (medecin)
- `src/app/navbar/` — bouton Connexion / Profil / Déconnexion, lien « Espace médecin » si rôle medecin
- `src/app/sidebar/sidebar.ts` — déconnexion Keycloak
- `src/assets/silent-check-sso.html` — page pour le silent SSO check (optionnel)

---

## 9. Démarrer l’application

1. Démarrer Keycloak (ex. port 8180).
2. Vérifier realm, client, rôles et utilisateurs comme ci-dessus.
3. Lancer l’app Angular : `npm start` (ex. http://localhost:4200).
4. Tester avec un utilisateur **patient** : accès à `/home` uniquement.
5. Tester avec un utilisateur **medecin** : accès à `/back` ; depuis `/home`, redirection vers `/back`.

Si la connexion ne se fait pas, vérifier la console du navigateur et que les **Valid redirect URIs** et **Web origins** Keycloak correspondent bien à l’URL de l’app (ex. `http://localhost:4200`).

---

## 10. Login personnalisé (formulaire Angular + Spring Boot + Keycloak)

L’application propose une **page de connexion personnalisée** (identifiant / mot de passe) sans redirection vers l’interface Keycloak. Le flux est le suivant :

1. L’utilisateur saisit **identifiant** et **mot de passe** sur la page `/login` (Angular).
2. Angular envoie les identifiants au backend Spring Boot : `POST /api/auth/login`.
3. Le backend appelle Keycloak (grant **Resource Owner Password**) et récupère un JWT.
4. Le backend renvoie le token à Angular, qui le stocke et l’envoie sur chaque requête API (Bearer).

### 10.1 Client Keycloak pour le backend (confidential)

Pour que le backend puisse obtenir un token à partir du couple username/password, il faut un **client confidentiel** dans Keycloak :

1. **Clients** → **Create client**.
2. **Client ID** : `vurr-backend` (ou la valeur de `keycloak.client-id-backend` dans `application.properties`).
3. **Client authentication** : **ON** (client confidentiel).
4. **Direct access grants** : **ON** (Resource Owner Password Credentials).
5. Sauvegarder, puis onglet **Credentials** : copier le **Secret**.
6. Dans **NEPHRO** → `src/main/resources/application.properties` :

```properties
keycloak.client-id-backend=vurr-backend
keycloak.client-secret=VOTRE_SECRET_ICI
keycloak.realm=vurrealm
keycloak.url=http://localhost:8180
```

Le **realm** et l’**URL** doivent être les mêmes que ceux utilisés pour le front (et pour la validation JWT).

### 10.2 Lier MySQL (optionnel)

Les utilisateurs peuvent rester **uniquement dans Keycloak** (realm + rôles). Pour s’appuyer aussi sur une base MySQL :

- **Option A** : Dans `KeycloakLoginService.login()`, avant d’appeler Keycloak, vérifier l’utilisateur en base (ex. table `utilisateur`) et rejeter si absent ou mot de passe invalide. Ensuite, appeler Keycloak avec les mêmes identifiants (les utilisateurs doivent donc exister aussi dans Keycloak pour obtenir un JWT).
- **Option B** : Configurer une **User Federation** Keycloak vers MySQL pour que Keycloak lise les utilisateurs depuis la base.

---

## 11. Intégration Spring Boot (backend NEPHRO)

Le backend Spring Boot (projet **NEPHRO**, port 8089) valide les JWT émis par Keycloak et protège les API.

### 11.1 Dépendances ajoutées (pom.xml)

- `spring-boot-starter-oauth2-resource-server` — validation JWT (issuer-uri Keycloak)
- `spring-boot-starter-security` — filtres et configuration sécurité

### 11.2 Configuration (application.properties)

```properties
# Keycloak — même realm que le front (keycloak-config.ts)
spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8180/realms/vurrealm
```

L’issuer-uri doit correspondre au **realm** configuré dans Keycloak et dans `keycloak-config.ts` (ex. `vurrealm` → `http://localhost:8180/realms/vurrealm`).

### 11.3 SecurityConfig (résumé)

- **JWT** : les requêtes vers `/api/**` et `/suivis/**` doivent contenir l’en-tête `Authorization: Bearer <token>` (token Keycloak). Spring valide la signature et l’issuer via l’issuer-uri.
- **Rôles** : les rôles Keycloak (realm et client) sont mappés en `ROLE_MEDECIN`, `ROLE_PATIENT` pour pouvoir utiliser `@PreAuthorize("hasRole('MEDECIN')")` sur les contrôleurs si besoin.
- **CORS** : origine autorisée `http://localhost:4200` (front Angular), `Allow-Credentials: true` pour l’envoi du token.
- **Routes publiques** : `/uploads/**`, `/error`, `/actuator/health` en `permitAll()` ; le reste est `authenticated()`.

### 11.4 Ordre de démarrage

1. Démarrer **Keycloak** (ex. port 8180).
2. Démarrer le **backend Spring Boot** NEPHRO (port 8089) — au démarrage il récupère les clés publiques depuis `http://localhost:8180/realms/vurrealm/protocol/openid-connect/certs`.
3. Démarrer le **front Angular** (port 4200), se connecter via la page login → le token est envoyé automatiquement aux appels vers 8089.

### 11.5 Fichiers backend modifiés/créés

- **NEPHRO/pom.xml** — dépendances `oauth2-resource-server` et `security`
- **NEPHRO/src/main/resources/application.properties** — `spring.security.oauth2.resourceserver.jwt.issuer-uri`, `keycloak.*` (login personnalisé)
- **NEPHRO/src/main/java/.../config/SecurityConfig.java** — chaîne de filtres, CORS, `permitAll()` pour `/api/auth/login`, conversion JWT → authorities
- **NEPHRO/.../Controllers/AuthController.java** — `POST /api/auth/login` (reçoit username/password, appelle Keycloak, renvoie le token)
- **NEPHRO/.../Services/KeycloakLoginService.java** — appel au endpoint token Keycloak (Resource Owner Password)
- **NEPHRO/.../dto/LoginRequest.java**, **LoginResponse.java** — DTOs login

### 11.6 Restriction par rôle côté backend (optionnel)

Pour réserver certaines API aux médecins uniquement, ajouter sur un contrôleur ou une méthode :

```java
@PreAuthorize("hasRole('MEDECIN')")
@GetMapping
public ResponseEntity<List<DossierMedicalDTO>> getAllDossiers() { ... }
```

Les rôles dans le token Keycloak sont exposés avec le préfixe `ROLE_` (ex. `medecin` → `ROLE_MEDECIN`).

---

## 12. Fichier `.env` du microservice Symfony (`dosiersymfony/user-service`)

À faire correspondre **exactement** à votre Keycloak (surtout l’URL et le realm) :

| Variable | Exemple | Rôle |
|----------|---------|------|
| `KEYCLOAK_BASE_URL` | `http://localhost:8080` | URL **sans** `/` final. Si Keycloak est en HTTPS avec certificat local, ajoutez `KEYCLOAK_HTTP_INSECURE=1` dans `.env.local`. |
| `KEYCLOAK_REALM` | `kidneyCare-realm` | Même nom que dans l’admin Keycloak et que `keycloak-config.ts`. |
| `KEYCLOAK_CLIENT_ID` | `kidneycare-app` | Même valeur que `clientId` dans `keycloak-config.ts`. |
| `KEYCLOAK_CLIENT_SECRET` | *(vide si client public)* | Rempli seulement pour un client confidentiel. |
| `KEYCLOAK_ADMIN_USERNAME` | `admin` | Compte realm **master** pour l’API admin (création utilisateur à l’inscription). |
| `KEYCLOAK_ADMIN_PASSWORD` | *(votre mot de passe)* | Mot de passe admin Keycloak. |

**Vérification rapide :** avec Symfony démarré, ouvrir `http://127.0.0.1:8000/api/auth/ping` (JSON `ok`). Ensuite tester l’inscription : en cas d’erreur **503**, lire le JSON (`message`, `hint`) dans l’onglet Network du navigateur.

**Angular** : `src/app/auth/keycloak-config.ts` doit utiliser la **même** `url`, `realm` et `clientId` que le `.env` Symfony ci-dessus.
