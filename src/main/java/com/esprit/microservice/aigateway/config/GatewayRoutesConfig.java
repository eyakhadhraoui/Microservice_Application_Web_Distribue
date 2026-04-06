package com.esprit.microservice.aigateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

/**
 * Routage aligné avec l’architecture : Angular → Gateway → Eureka + user-service Symfony (M0) + dossiermedicale (dossier médical), etc.
 * <p>
 * Noms {@code lb://…} : doivent correspondre à {@code spring.application.name} tel qu’enregistré dans Eureka.
 */
@Configuration
public class GatewayRoutesConfig {

    /**
     * Microservice utilisateur Symfony (PostgreSQL), hors Eureka — auth {@code /api/auth/**} et CRUD {@code /api/users/**}.
     * Surcharge : {@code gateway.user-service.uri} (ex. Docker : {@code http://user-service:8000}).
     */
    @Bean
    public RouteLocator gatewayRoutes(
            RouteLocatorBuilder builder,
            @Value("${gateway.user-service.uri:http://127.0.0.1:8000}") String userServiceUri) {
        return builder.routes()

                .route("PRESCRIPTION_SERVICE", r -> r.path("/prescription/**")
                        .filters(f -> f.stripPrefix(1))
                        .uri("lb://prescription-Service"))

                .route("INFECTION_SERVICE", r -> r.path("/infection/**")
                        .filters(f -> f.stripPrefix(1))
                        .uri("lb://InfectionEtVaccination"))

                .route("PROJET_SERVICE", r -> r.path("/projet/**")
                        .uri("lb://projetconsultation"))

                .route("HOSPITALISATION_SERVICE", r -> r.path("/hospitalisation/**")
                        .filters(f -> f.stripPrefix(1))
                        .uri("lb://Hospitalisation"))

                .route("DOSSIER_MEDICAL_PREFIX", r -> r.path("/nephro/**")
                        .filters(f -> f.stripPrefix(1))
                        .uri("lb://dossiermedicale"))

                .route("PRESCRIPTION_API_MEDICATIONS", r -> r.path("/api/medications/**")
                        .uri("lb://prescription-Service"))

                .route("PRESCRIPTION_API_PRESCRIPTIONS", r -> r.path("/api/prescriptions/**")
                        .uri("lb://prescription-Service"))

                .route("PRESCRIPTION_API_ITEMS", r -> r.path("/api/prescription-items/**")
                        .uri("lb://prescription-Service"))

                .route("PRESCRIPTION_API_HISTORY", r -> r.path("/api/medication-history/**")
                        .uri("lb://prescription-Service"))

                .route("PRESCRIPTION_API_DOSAGE", r -> r.path("/api/dosage-adjustments/**")
                        .uri("lb://prescription-Service"))

                .route("PRESCRIPTION_API_ALERTS", r -> r.path("/api/doctor-alerts/**")
                        .uri("lb://prescription-Service"))

                // M0 utilisateur (Symfony) : auth + CRUD /api/users — avant le catch-all NEPHRO (sinon 500/404)
                .route("USER_AUTH_SYMFONY", r -> r.order(Ordered.HIGHEST_PRECEDENCE)
                        .path("/api/auth/**")
                        .uri(userServiceUri))
                .route("USER_API_USERS_SYMFONY", r -> r.order(Ordered.HIGHEST_PRECEDENCE)
                        .path("/api/users/**")
                        .uri(userServiceUri))

                // dossiermedicale = dossier médical… (ne couvre pas /api/auth ni /api/users)
                .route("DOSSIER_MEDICAL_API", r -> r.path("/api/**", "/suivis/**", "/uploads/**")
                        .uri("lb://dossiermedicale"))

                // CRUD users Symfony : front peut appeler /users/** → /api/users/** côté PHP
                .route("USER_SYMFONY_SERVICE", r -> r.path("/users/**")
                        .filters(f -> f.rewritePath("/users(?<segment>/?.*)", "/api/users${segment}"))
                        .uri(userServiceUri))

                .build();
    }
}
