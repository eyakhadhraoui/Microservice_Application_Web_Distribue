# KidneyCare — Plateforme Médicale Microservices

> Plateforme de gestion médicale dédiée aux patients atteints de maladies rénales.
> Architecture microservices complète avec authentification centralisée (Keycloak), API Gateway Spring Cloud, monitoring Prometheus/Grafana, messagerie asynchrone RabbitMQ et interface Angular.

---

## Table des matières

1. [Architecture générale](#architecture-générale)
2. [Services et ports](#services-et-ports)
3. [Microservices métier](#microservices-métier)
4. [Infrastructure](#infrastructure)
5. [Frontend Angular](#frontend-angular)
6. [Prérequis](#prérequis)
7. [Démarrage rapide](#démarrage-rapide)
8. [Variables d'environnement](#variables-denvironnement)
9. [API Gateway — Routes](#api-gateway--routes)
10. [Documentation API (Swagger UI)](#documentation-api-swagger-ui)
11. [Monitoring](#monitoring)
12. [Configuration Keycloak](#configuration-keycloak)
13. [Base de données](#base-de-données)
14. [Structure du projet](#structure-du-projet)
15. [Développement local (sans Docker)](#développement-local-sans-docker)
16. [Dépannage](#dépannage)
17. [Sécurité et secrets](#sécurité-et-secrets)
18. [Contribution / Git](#contribution--git)

---

## Architecture générale

```
                    ┌──────────────────────────────────────┐
                    │          Navigateur / Angular         │
                    │        http://localhost (port 80)     │
                    └─────────────────┬────────────────────┘
                                      │ HTTP / WebSocket
                                      ▼
                    ┌──────────────────────────────────────┐
                    │       API Gateway (Spring Cloud)      │
                    │        http://localhost:8095          │
                    │                                       │
                    │  • Validation JWT Keycloak            │
                    │  • Routage dynamique (Eureka lb://)   │
                    │  • CORS centralisé                    │
                    │  • Swagger UI agrégé (tous services)  │
                    │  • WebSocket SockJS/STOMP             │
                    └──┬──────┬──────┬──────┬──────────────┘
                       │      │      │      │
          ┌────────────┘      │      │      └───────────────────┐
          ▼                   ▼      ▼                          ▼
┌──────────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────────────┐
│ dossiermedicale  │ │prescription │ │consultation │ │infection &         │
│  (port 8089)     │ │(port 8086)  │ │(port 8081)  │ │vaccination         │
│  Spring Boot     │ │Spring Boot  │ │Spring Boot  │ │(port 8082)         │
│  MySQL           │ │MySQL        │ │H2 in-memory │ │H2 in-memory        │
└──────────────────┘ └─────────────┘ └─────────────┘ └────────────────────┘

┌──────────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────────────┐
│  user-service    │ │  Keycloak   │ │   Eureka    │ │  Config Server     │
│ Symfony + PHP    │ │  port 8081  │ │  port 8761  │ │  port 8888         │
│  PostgreSQL      │ │ IAM/OAuth2  │ │  Discovery  │ │  Config centralisé │
└──────────────────┘ └─────────────┘ └─────────────┘ └────────────────────┘

┌──────────────────┐ ┌─────────────┐ ┌─────────────┐
│   Prometheus     │ │   Grafana   │ │  RabbitMQ   │
│   port 9090      │ │  port 3000  │ │ port 5672   │
│   Métriques      │ │ Dashboards  │ │ Async mail  │
└──────────────────┘ └─────────────┘ └─────────────┘
```

**Flux d'authentification :**
```
Angular ──OAuth2 PKCE──► Keycloak (port 8081)
                              │
                              │ JWT (access_token)
                              ▼
Angular ──Bearer Token──► API Gateway ──valide JWT──► Microservice
```

---

## Services et ports

| Service | Port exposé | URL locale | Description |
|---|---|---|---|
| **Frontend Angular** | 80 | http://localhost | Interface utilisateur (nginx) |
| **API Gateway** | 8095 | http://localhost:8095 | Point d'entrée unique |
| **Keycloak** | 8081 | http://localhost:8081 | Console admin IAM |
| **Eureka Dashboard** | 8761 | http://localhost:8761 | Registre de services |
| **Config Server** | 8888 | http://localhost:8888 | Configuration centralisée |
| **User Service (Symfony)** | 8000 | http://localhost:8000 | Gestion utilisateurs |
| **Grafana** | 3000 | http://localhost:3000 | Dashboards monitoring |
| **Prometheus** | 9090 | http://localhost:9090 | Collecte de métriques |
| **RabbitMQ Management** | 15672 | http://localhost:15672 | Interface RabbitMQ |
| **MySQL** | 3306 | localhost:3306 | Base de données relationnelle |
| **PostgreSQL** | 5432 | localhost:5432 | Base de données user-service |

> Les ports des microservices métier (8081, 8082, 8086, 8089) ne sont **pas exposés** directement.
> Tout accès se fait via l'API Gateway sur le port **8095**.

---

## Microservices métier

### dossiermedicale (port interne 8089)

| Propriété | Valeur |
|---|---|
| **Rôle** | Gestion des dossiers médicaux patients |
| **Fonctionnalités** | Résultats labo, images médicales, suivis, alertes, notes internes, rapports BI, calendrier, notifications WebSocket |
| **Stack** | Spring Boot · Spring Data JPA · MySQL · JavaMail · WebSocket (SockJS/STOMP) · SpringDoc OpenAPI |
| **Routes gateway** | `/api/**`, `/suivis/**`, `/uploads/**`, `/ws/**` |
| **Répertoire** | `NEPHRO/` |

### prescription-Service (port interne 8086)

| Propriété | Valeur |
|---|---|
| **Rôle** | Prescriptions et gestion des médicaments |
| **Fonctionnalités** | Prescriptions, médicaments, items, ajustements de dosage, historique, alertes médecin, monitoring traitement |
| **Stack** | Spring Boot · Spring Data JPA · MySQL · Keycloak Admin |
| **Routes gateway** | `/api/prescriptions/**`, `/api/medications/**`, `/api/prescription-items/**`, `/api/dosage-adjustments/**`, `/api/doctor-alerts/**`, `/api/medication-history/**` |
| **Répertoire** | `prescription-Service/` |

### projetconsultation (port interne 8081)

| Propriété | Valeur |
|---|---|
| **Rôle** | Consultations médicales et rendez-vous |
| **Fonctionnalités** | Consultations, rendez-vous, rapports, gestion patients et médecins |
| **Stack** | Spring Boot · Spring Data JPA · H2 in-memory · Spring Security (JWT) |
| **Context-path** | `/projet` |
| **Routes gateway** | `/projet/**` |
| **Répertoire** | `projetconsultation/` |

### InfectionEtVaccination (port interne 8082)

| Propriété | Valeur |
|---|---|
| **Rôle** | Suivi des infections et des vaccinations |
| **Stack** | Spring Boot · Spring Data JPA · H2 in-memory |
| **Context-path** | `/infection` |
| **Routes gateway** | `/infection/**` |
| **Répertoire** | `InfectionEtVaccination/` |

### user-service (port interne 8000)

| Propriété | Valeur |
|---|---|
| **Rôle** | Authentification, gestion des profils, synchronisation Keycloak |
| **Fonctionnalités** | Login, refresh token, CRUD utilisateurs, intégration Keycloak Admin API |
| **Stack** | Symfony 7 · PHP 8.4 · PostgreSQL · Doctrine ORM |
| **Routes gateway** | `/api/auth/**`, `/api/users/**`, `/users/**` |
| **Répertoire** | `dosiersymfony/user-service/` |

### ai-gateway (port 8095)

| Propriété | Valeur |
|---|---|
| **Rôle** | Passerelle API centrale — sécurité, routage, documentation |
| **Fonctionnalités** | Validation JWT multi-issuer, routage Eureka lb://, CORS, Swagger agrégé, WebSocket |
| **Stack** | Spring Cloud Gateway · Spring WebFlux · Spring Security OAuth2 |
| **Répertoire** | `wetransfer_api_2026-03-24_1825/API/` |

---

## Infrastructure

### Keycloak — Gestion des identités et des accès

- **Version** : 26.0.7
- **URL admin** : http://localhost:8081 — `admin` / `admin`
- **Realm** : `kidneyCare-realm` (importé automatiquement au démarrage)
- **Client** : `kidneycare-app` (Authorization Code + PKCE, public)
- **Import du realm** : `docker/keycloak/import/kidneyCare-realm.json`

### Eureka — Registre de services

- **Dashboard** : http://localhost:8761
- **Répertoire** : `demo/`
- Tous les microservices Spring Boot s'enregistrent automatiquement sous leur `spring.application.name`

### Spring Cloud Config Server

- **URL** : http://localhost:8888
- **Mode** : `native` (fichiers dans `config-repo/`)
- **Répertoire** : `COnfigServer/COnfigServer/`
- Les services se connectent avec `SPRING_CONFIG_IMPORT=optional:configserver:http://config-server:8888/`
- Un healthcheck garantit que les services attendent la disponibilité du Config Server

### RabbitMQ — Messagerie asynchrone

- **AMQP** : port 5672
- **Management UI** : http://localhost:15672 — `guest` / `guest`
- **Usage** : Envoi asynchrone d'e-mails de notification (suivi patient, alertes labo)

---

## Frontend Angular

- **Framework** : Angular 21 (TypeScript, RxJS)
- **Répertoire** : `mon-projet/`
- **Port dev** : 4200 (`ng serve`)
- **Port prod** : 80 (nginx dans Docker)

### Authentification frontend

```typescript
// mon-projet/src/app/auth/keycloak-config.ts
{
  url:      'http://localhost:8081',
  realm:    'kidneyCare-realm',
  clientId: 'kidneycare-app'
}
```

### Proxy de développement (`proxy.conf.json`)

| Chemin | Destination |
|---|---|
| `/api/auth/**`, `/api/users/**` | `http://127.0.0.1:8000` (Symfony) |
| `/api/**` | `http://127.0.0.1:8095` (Gateway) |
| `/projet/**` | `http://127.0.0.1:8095` (Gateway) |
| `/prescription/**` | `http://127.0.0.1:8095` (Gateway) |
| `/ws/**` | `http://127.0.0.1:8095` (WebSocket) |

---

## Prérequis

| Outil | Version minimale |
|---|---|
| **Docker** | 24+ |
| **Docker Compose** | 2.20+ |
| **Git** | 2.x |

> Aucune installation locale de Java, Node.js, PHP ou Maven n'est requise.
> Tout est compilé et exécuté dans Docker via des builds multi-étapes.

**Ressources recommandées :**
- RAM : 8 Go minimum (16 Go recommandés) — Keycloak, MySQL, 6 JVM Spring Boot + PHP
- Disque : 10 Go pour les images et volumes Docker

---

## Démarrage rapide

```bash
# 1. Cloner le dépôt
git clone <URL_DU_REPO>
cd <NOM_DU_DOSSIER>

# 2. Premier démarrage — build de toutes les images + lancement
docker compose up --build -d

# 3. Vérifier que tous les services sont actifs
docker compose ps

# 4. Suivre les logs (optionnel)
docker compose logs -f
```

> Le premier démarrage peut prendre **5 à 15 minutes** (compilation Maven × 6 services + build Angular + téléchargement des images).

### Ordre de démarrage automatique (géré par Docker Compose)

```
MySQL · PostgreSQL · RabbitMQ (pas de dépendances)
             ↓
Keycloak · Eureka (healthcheck: /actuator/health)
             ↓
Config Server (attend Eureka healthy)
             ↓
Microservices Spring Boot (attendent config-server + mysql healthy)
             ↓
API Gateway (attend tous les microservices)
             ↓
Frontend nginx (attend le gateway)
             ↓
Prometheus · Grafana
```

### URLs après démarrage

| URL | Description | Identifiants |
|---|---|---|
| http://localhost | Application Angular | Compte Keycloak |
| http://localhost:8095/swagger-ui.html | Documentation API (Swagger) | Via Keycloak OAuth2 |
| http://localhost:8761 | Eureka — registre de services | — |
| http://localhost:8081 | Keycloak — console admin | admin / admin |
| http://localhost:3000 | Grafana — monitoring | admin / admin |
| http://localhost:15672 | RabbitMQ management | guest / guest |

### Commandes utiles

```bash
# Rebuilder un seul service après modification du code
docker compose build <service> && docker compose up -d <service>

# Voir les logs d'un service spécifique
docker compose logs -f ai-gateway
docker compose logs -f dossiermedicale

# Arrêter tous les services (données conservées dans les volumes)
docker compose down

# Reset complet — supprime aussi les volumes de données
docker compose down -v

# Appliquer les migrations Symfony (si nécessaire)
docker compose exec user-service php bin/console doctrine:migrations:migrate --no-interaction
```

### Noms des services Docker Compose

| Nom dans docker-compose | Description |
|---|---|
| `ai-gateway` | API Gateway |
| `dossiermedicale` | Microservice dossier médical |
| `prescription-service` | Microservice prescriptions |
| `projetconsultation` | Microservice consultations |
| `infection-vaccination` | Microservice infections & vaccinations |
| `user-service` | Service utilisateurs Symfony |
| `eureka-server` | Registre Eureka |
| `config-server` | Config Server |
| `keycloak` | Serveur Keycloak |
| `mysql` | Base MySQL |
| `postgres` | Base PostgreSQL |
| `rabbitmq` | Broker RabbitMQ |
| `prometheus` | Prometheus |
| `grafana` | Grafana |
| `frontend` | Application Angular (nginx) |

---

## Variables d'environnement

Les valeurs par défaut du `docker-compose.yml` fonctionnent pour un environnement local.
Pour surcharger, créer un fichier `.env` à la racine.

### API Gateway

| Variable | Valeur par défaut | Description |
|---|---|---|
| `GATEWAY_KEYCLOAK_JWK_SET_URI` | `http://keycloak:8080/realms/kidneyCare-realm/protocol/openid-connect/certs` | JWK endpoint Keycloak |
| `GATEWAY_KEYCLOAK_ALLOWED_ISSUERS` | `http://localhost:8080/realms/kidneyCare-realm,...` | Issuers JWT acceptés (multi-valeur CSV) |
| `GATEWAY_USERSERVICE_URI` | `http://user-service:8000` | URI du service utilisateur |
| `GATEWAY_PUBLIC_HOST` | `localhost:8095` | Hôte public pour les URLs OpenAPI |
| `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` | `http://eureka-server:8761/eureka/` | URL Eureka |

### Microservices Spring Boot (commun)

| Variable | Valeur par défaut | Description |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://mysql:3306/nep` | URL MySQL |
| `SPRING_DATASOURCE_USERNAME` | `root` | Utilisateur MySQL |
| `SPRING_DATASOURCE_PASSWORD` | `root` | Mot de passe MySQL |
| `SPRING_CLOUD_CONFIG_URI` | `http://config-server:8888` | URL Config Server |
| `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` | `http://eureka-server:8761/eureka/` | URL Eureka |

### dossiermedicale — E-mail et notifications

| Variable | Description |
|---|---|
| `SPRING_MAIL_HOST` | Serveur SMTP (ex. `smtp.gmail.com`) |
| `SPRING_MAIL_PORT` | Port SMTP (ex. `587`) |
| `SPRING_MAIL_USERNAME` | Adresse e-mail expéditeur |
| `SPRING_MAIL_PASSWORD` | Mot de passe application SMTP |
| `APP_MAIL_FROM` | Adresse "From" des e-mails |
| `SPRING_RABBITMQ_HOST` | Hôte RabbitMQ pour envoi asynchrone |
| `NOTIFICATION_SUIVI_PATIENT_ACTIF` | `true` pour activer les notifications de suivi |

### User Service (Symfony)

| Variable | Description |
|---|---|
| `DATABASE_URL` | URL PostgreSQL complète |
| `KEYCLOAK_BASE_URL` | URL interne Keycloak (`http://keycloak:8080`) |
| `INTERNAL_USER_SYNC_KEY` | Clé secrète de synchronisation interne |
| `NEPHRO_GATEWAY_BASE_URL` | URL de la gateway (`http://ai-gateway:8095`) |
| `CORS_ALLOW_ORIGIN` | Regex CORS pour le frontend |

---

## API Gateway — Routes

### Routes d'authentification (publiques)

| Méthode | Chemin | Service | Notes |
|---|---|---|---|
| POST | `/api/auth/login` | user-service | Obtention du token Keycloak |
| POST | `/api/auth/refresh` | user-service | Rafraîchissement du token |
| POST | `/api/patients/register-profile` | dossiermedicale | Inscription patient |

### Routes métier (JWT requis)

| Chemin | Service cible | Description |
|---|---|---|
| `/api/dossiers-medicaux/**` | dossiermedicale | Dossiers médicaux |
| `/api/patients/**` | dossiermedicale | Patients |
| `/api/suivis/**` | dossiermedicale | Suivis médicaux |
| `/api/alertes/**` | dossiermedicale | Alertes |
| `/api/modules-labo/**` | dossiermedicale | Résultats de laboratoire |
| `/uploads/**` | dossiermedicale | Fichiers uploadés (public) |
| `/ws/**` | dossiermedicale | WebSocket temps réel |
| `/api/prescriptions/**` | prescription-Service | Prescriptions |
| `/api/prescription-items/**` | prescription-Service | Items de prescription |
| `/api/dosage-adjustments/**` | prescription-Service | Ajustements dosage |
| `/api/doctor-alerts/**` | prescription-Service | Alertes médecin |
| `/api/medication-history/**` | prescription-Service | Historique médicaments |
| `/api/medications/**` | prescription-Service | Médicaments (public) |
| `/projet/**` | projetconsultation | Consultations et rendez-vous |
| `/infection/**` | InfectionEtVaccination | Infections et vaccinations |
| `/api/users/**` | user-service | Gestion des utilisateurs |

### Rôles Keycloak et accès

| Rôle | Accès accordé |
|---|---|
| `medecin` | Lecture/écriture dossiers, prescriptions, consultations, alertes |
| `patient` | Lecture de ses propres données |

---

## Documentation API (Swagger UI)

L'API Gateway centralise la documentation de tous les microservices.

**URL** : http://localhost:8095/swagger-ui.html

| Onglet | Service |
|---|---|
| Prescription Service | prescription-Service |
| Dossier Médical | dossiermedicale |
| Consultations | projetconsultation |
| Infection et Vaccination | InfectionEtVaccination |

### S'authentifier dans Swagger UI

**Méthode 1 — OAuth2 PKCE (recommandé)**

1. Ouvrir http://localhost:8095/swagger-ui.html
2. Cliquer sur **Authorize** (icône cadenas)
3. Choisir le schéma **oauth2** — `kidneycare-app` est pré-rempli
4. Cliquer **Authorize** → page de connexion Keycloak
5. Se connecter → retour automatique dans Swagger
6. Tous les appels "Try it out" incluent le JWT automatiquement

**Méthode 2 — Token Bearer manuel**

1. Obtenir un token via Keycloak :
```bash
curl -X POST http://localhost:8081/realms/kidneyCare-realm/protocol/openid-connect/token \
  -d "client_id=kidneycare-app" \
  -d "grant_type=password" \
  -d "username=<user>" \
  -d "password=<password>"
```
2. Copier la valeur `access_token`
3. Dans Swagger UI → **Authorize** → schéma **bearer-jwt** → coller le token

---

## Monitoring

### Prometheus

- **URL** : http://localhost:9090
- Scrape automatique de `/actuator/prometheus` sur chaque microservice Spring Boot
- Configuration : `monitoring/prometheus.yml`

### Grafana

- **URL** : http://localhost:3000 — `admin` / `admin`
- Datasource Prometheus pré-configurée au démarrage
- Dashboards provisionnés depuis `monitoring/grafana/provisioning/`

### Endpoints Actuator (par microservice)

| Endpoint | Description |
|---|---|
| `GET /actuator/health` | Santé du service (utilisé par Docker healthcheck) |
| `GET /actuator/prometheus` | Métriques au format Prometheus |
| `GET /actuator/info` | Informations de build |

---

## Configuration Keycloak

### Paramètres du realm

| Paramètre | Valeur |
|---|---|
| Realm | `kidneyCare-realm` |
| Client ID | `kidneycare-app` |
| Flow | Authorization Code + PKCE |
| Access Type | Public |

### Redirect URIs à configurer dans Keycloak

Aller dans : **Keycloak Admin → Realm kidneyCare-realm → Clients → kidneycare-app → Valid redirect URIs**

Ajouter :
```
http://localhost
http://localhost:4200
http://localhost:8095/swagger-ui/oauth2-redirect.html
```

### Rôles à assigner aux utilisateurs de test

| Rôle | Description |
|---|---|
| `medecin` | Accès complet aux fonctionnalités médecin |
| `patient` | Accès aux données personnelles du patient |

---

## Base de données

### MySQL — Base `nep`

Partagée par les microservices Spring Boot :

| Service | Tables principales |
|---|---|
| dossiermedicale | `patient`, `dossier_medical`, `suivi`, `resultat_laboratoire`, `image_medicale`, `note_interne`, `alerte`, `medecin` |
| prescription-Service | `prescription`, `medication`, `prescription_item`, `dosage_adjustment`, `doctor_alert`, `medication_history` |

**Connexion locale** : `jdbc:mysql://localhost:3306/nep` — root / root

### PostgreSQL — Base `nephro_users`

Exclusive au user-service Symfony :

| Table | Description |
|---|---|
| `user` | Comptes utilisateurs et profils |
| Tokens OAuth2 | Tokens d'accès et de rafraîchissement |

**Connexion locale** : `postgresql://postgres:root@localhost:5432/nephro_users`

### H2 In-Memory (développement)

| Service | JDBC URL | Console |
|---|---|---|
| projetconsultation | `jdbc:h2:mem:consultationdb` | http://localhost:8081/h2-console |
| InfectionEtVaccination | `jdbc:h2:mem:infectiondb` | http://localhost:8082/h2 |

> Les données H2 sont **perdues à chaque redémarrage** du service.

---

## Structure du projet

```
.
├── docker-compose.yml                          # Orchestration complète (15 services)
├── README.md
│
├── monitoring/
│   ├── prometheus.yml                          # Scrape config Prometheus
│   └── grafana/
│       └── provisioning/                       # Datasources et dashboards auto-provisionnés
│
├── docker/
│   └── keycloak/
│       └── import/
│           └── kidneyCare-realm.json           # Realm Keycloak importé au démarrage
│
├── wetransfer_api_2026-03-24_1825/API/         # API Gateway (Spring Cloud Gateway)
│   ├── src/main/java/.../config/
│   │   ├── GatewayRoutesConfig.java            # Définition des routes
│   │   ├── SecurityConfig.java                 # Validation JWT multi-issuer
│   │   └── OpenApiGatewayConfig.java           # Swagger UI agrégé
│   └── src/main/resources/application.properties
│
├── demo/                                       # Eureka Server (Spring Cloud Netflix)
│
├── COnfigServer/COnfigServer/                  # Spring Cloud Config Server
│   └── src/main/resources/
│       └── config-repo/                        # Fichiers de config par service
│           ├── application.properties          # Config partagée (tous les services)
│           ├── dossiermedicale.properties
│           ├── prescription-Service.properties
│           ├── projetconsultation.properties
│           └── InfectionEtVaccination.properties
│
├── NEPHRO/                                     # Microservice dossiermedicale
│   └── src/main/java/.../
│       ├── Controllers/                        # REST Controllers
│       ├── Services/                           # Logique métier
│       ├── Entities/                           # Entités JPA
│       └── config/
│           ├── SecurityConfig.java
│           └── OpenApiConfig.java              # Schéma Bearer JWT / OAuth2
│
├── prescription-Service/                       # Microservice prescriptions
├── projetconsultation/                         # Microservice consultations
├── InfectionEtVaccination/                     # Microservice infections & vaccinations
│
├── dosiersymfony/
│   └── user-service/                           # API utilisateurs Symfony
│       ├── src/
│       ├── docker-entrypoint.sh
│       └── Dockerfile
│
└── mon-projet/                                 # Frontend Angular 21
    ├── src/app/
    │   └── auth/
    │       └── keycloak-config.ts              # Config Keycloak frontend
    ├── proxy.conf.json                         # Proxy dev (ng serve)
    ├── angular.json
    └── Dockerfile                              # Build multi-étapes → nginx
```

---

## Développement local (sans Docker)

Pour travailler sur un seul service sans démarrer la stack complète :

```bash
# 1. Démarrer uniquement l'infrastructure
docker compose up -d mysql postgres keycloak eureka-server rabbitmq

# 2. Lancer le microservice cible en local
cd NEPHRO
mvn spring-boot:run -Dspring-boot.run.profiles=local

# 3. Frontend Angular
cd mon-projet
npm install
npm start   # http://localhost:4200 avec proxy vers la gateway
```

**JDK requis par service :**

| Service | JDK |
|---|---|
| Eureka Server (`demo`) | JDK 21 |
| Tous les autres Spring Boot | JDK 17 |

---

## Dépannage

| Problème | Cause probable | Solution |
|---|---|---|
| Service absent dans Eureka | Démarrage avant Config Server | Attendre 2-3 min ; vérifier `docker compose logs <service>` |
| `401 Unauthorized` sur la gateway | Token JWT absent ou issuer non reconnu | Vérifier que l'issuer dans le token correspond à `GATEWAY_KEYCLOAK_ALLOWED_ISSUERS` |
| `503 Service Unavailable` | Service non enregistré dans Eureka | Vérifier `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://eureka-server:8761/eureka/` |
| Swagger UI — URL Docker interne (172.x.x.x) | `GATEWAY_PUBLIC_HOST` mal configuré | Vérifier `gateway.public.host=localhost:8095` dans la gateway |
| `JavaMailSender` non trouvé (dossiermedicale) | Variables mail manquantes | Ajouter `SPRING_MAIL_HOST`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD` dans docker-compose |
| PostgreSQL : tables manquantes | Migrations non appliquées | `docker compose exec user-service php bin/console doctrine:migrations:migrate --no-interaction` |
| Keycloak : redirect_uri mismatch | URI non enregistrée dans le client | Ajouter l'URI dans **Keycloak Admin → Clients → kidneycare-app → Valid redirect URIs** |
| Build lent / timeout Maven | Téléchargement des dépendances | Normal au premier build ; les layers Docker sont ensuite mis en cache |
| CORS bloqué | Origine non autorisée | Vérifier `CORS_ALLOW_ORIGIN` dans user-service et la config CORS de la gateway (`CorsConfig.java`) |
| `auth.docker.io: no such host` | Problème DNS / VPN | Désactiver le VPN ou redémarrer Docker Desktop |

---

## Sécurité et secrets

> Les valeurs dans `docker-compose.yml` sont des **valeurs de démonstration uniquement**.

Avant toute mise en production :

- [ ] Changer le mot de passe **Keycloak admin** (`KEYCLOAK_ADMIN_PASSWORD`)
- [ ] Changer les mots de passe **MySQL** et **PostgreSQL**
- [ ] Remplacer `APP_SECRET` Symfony par une valeur aléatoire sécurisée
- [ ] Stocker les secrets dans un gestionnaire de secrets (Vault, AWS Secrets Manager, etc.)
- [ ] Ne **jamais commiter** `.env.local`, credentials, clés API ou mots de passe réels dans Git
- [ ] Ajouter un `.gitignore` couvrant : `node_modules/`, `target/`, `vendor/`, `.env.local`, `dist/`, fichiers IDE

---

## Contribution / Git

```bash
# Vérifier le .gitignore avant le premier commit
cat .gitignore

# Structure de commit recommandée
git commit -m "feat(dossiermedicale): add patient alert notification"
git commit -m "fix(gateway): correct X-Forwarded-Host for OpenAPI server URL"
git commit -m "docs: update README with monitoring section"
```

**Préfixes conventionnels :**

| Préfixe | Usage |
|---|---|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `docs` | Documentation |
| `refactor` | Refactoring sans changement de comportement |
| `config` | Modification de configuration |
| `ci` | Pipeline CI/CD |

---

## Licence

Projet académique — ESPRIT School of Engineering
© 2025–2026 KidneyCare Team
