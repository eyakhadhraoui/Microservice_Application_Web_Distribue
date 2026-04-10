# KidneyCare — Application Web Distribuée (Microservices)

Plateforme médicale distribuée pour la gestion des dossiers patients, prescriptions, consultations, hospitalisation et authentification centralisée via Keycloak.  
Architecture basée sur **microservices Spring Boot**, **API Gateway Spring Cloud**, **Eureka**, **Keycloak**, **Docker Compose**, et un **front Angular**.

---

## Sommaire
- [Architecture](#architecture)
- [Technologies](#technologies)
- [Structure du projet](#structure-du-projet)
- [Prérequis](#prérequis)
- [Démarrage rapide (Docker)](#démarrage-rapide-docker)
- [Accès / Ports](#accès--ports)
- [Sécurité (Keycloak + JWT)](#sécurité-keycloak--jwt)
- [Communication inter-services](#communication-inter-services)
- [Base de données](#base-de-données)
- [Tests](#tests)
- [Dépannage](#dépannage)
- [Bonnes pratiques Git](#bonnes-pratiques-git)

---

## Architecture

```mermaid
flowchart LR
  A[Front Angular] --> G[API Gateway (Spring Cloud Gateway)]
  G --> E[Eureka Server]
  G --> D[dossiermedicale (Spring)]
  G --> P[prescription-service (Spring)]
  G --> C[projetconsultation (Spring)]
  G --> I[InfectionEtVaccination (Spring)]
  G --> H[Hospitalisation (Spring)]
  G --> U[user-service (Symfony)]
  A --> KC[Keycloak]
  G --> KC
  D & P & C & I & H --> MySQL[(MySQL)]
  U --> PG[(PostgreSQL)]
