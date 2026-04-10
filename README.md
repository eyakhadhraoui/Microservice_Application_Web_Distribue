# 🏥 KidneyCare — Application Web Distribuée (Microservices)

Plateforme médicale distribuée basée sur une architecture **microservices Spring Boot**, permettant la gestion des dossiers médicaux, prescriptions, consultations, hospitalisations et utilisateurs avec authentification sécurisée via Keycloak.

---

## 🛠️ Technologies utilisées

| Catégorie | Technologie |
|-----------|-------------|
| Frontend | Angular |
| Backend | Spring Boot (Java 17) |
| Gateway | Spring Cloud Gateway |
| Discovery | Eureka Server |
| Auth | Keycloak (JWT) |
| User Service | Symfony |
| BDD Médicale | MySQL |
| BDD Médicale | H2 |
| BDD Utilisateurs | PostgreSQL |
| Conteneurs | Docker / Docker Compose |

---

## 📁 Structure du projet

```
kidneyCare/
├── docker-compose.yml          # Orchestration des conteneurs
├── docker/
│   └── keycloak/import/        # Configuration Keycloak
├── demo/                       # Eureka Server
├── api-gateway/                # API Gateway Spring Cloud
├── NEPHRO/                     # Service dossier médical+MySQL
├── prescription-service/       #Service prescription+MySQL
├── consultation-service/       #Service consultation+H2
├── infection-service/          #Service infection+H2
├── hospitalisation-service/    #Service hospitalisation+H2 
├── user-service/               # Symfony+PostgreSQL
└── frontend-angular/           # Application Angular
```

---

## ⚙️ Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Docker Compose v2
- Connexion Internet active
- *(optionnel)* Java 17, Maven, Node.js pour exécution locale

---

## 🚀 Démarrage du projet

### Lancer tous les services

```bash
docker compose up -d --build
```

### Arrêter les services

```bash
docker compose down
```

---

## 🌐 Accès aux services

| Service | URL |
|---------|-----|
| Frontend Angular | http://localhost |
| API Gateway | http://localhost:8095 |
| Eureka Server | http://localhost:8761 |
| Keycloak | http://localhost:8080 |
| User Service | http://localhost:8000 |

---

## 🔐 Sécurité (Keycloak + JWT)

L'authentification est gérée par Keycloak.

### Fonctionnement

1. L'utilisateur se connecte via Keycloak
2. Un token JWT est généré
3. Le frontend envoie le token dans chaque requête (`Authorization: Bearer <token>`)
4. La Gateway valide le token avant de router la requête

### Rôles disponibles

| Rôle | Description |
|------|-------------|
| `medecin` | Accès complet aux dossiers, prescriptions, consultations, hospitalisations |
| `patient` | Consultation de son dossier, prescriptions et rendez-vous |

---

## 🔗 API principales

### 📁 Dossier Médical — `/nephro`

```
GET    /nephro/patients
POST   /nephro/patients
GET    /nephro/patients/{id}
PUT    /nephro/patients/{id}
DELETE /nephro/patients/{id}
```

### 💊 Prescription — `/prescription`

```
GET    /prescription
POST   /prescription
```

### 🩺 Consultation — `/consultation`

```
GET    /consultation
POST   /consultation
```

### 🏥 Hospitalisation — `/hospitalisation`

```
GET    /hospitalisation
POST   /hospitalisation
```

### 🦠 Infection — `/infection`

```
GET    /infection
POST   /infection
```

### 👤 Users — `/users`

```
GET    /users
POST   /users
```

---

## 🗄️ Base de données

| Base | Technologie | Données |
|------|-------------|---------|
| Données médicales | MySQL |DossierMedical Prescriptions |
| Données médicales | H2 | Consultations, Hospitalisations, Infections |
| Utilisateurs | PostgreSQL | Comptes, profils, rôles |

---

## 🔄 Communication inter-services

- Communication REST via API Gateway
- Services enregistrés dans **Eureka Server**
- Possibilité d'utiliser **Feign Client** pour la communication déclarative
- Extension future avec **RabbitMQ** (messaging asynchrone)

---

## 🔄 Workflow global

```
Utilisateur → Angular → Keycloak (JWT) → API Gateway → Eureka → Microservice → BDD
```

1. L'utilisateur accède au frontend Angular
2. Il se connecte via Keycloak → JWT généré
3. Les requêtes passent par l'API Gateway (port 8095)
4. La Gateway valide le token JWT
5. Eureka résout l'adresse du microservice cible
6. Le microservice traite la requête et persiste les données
