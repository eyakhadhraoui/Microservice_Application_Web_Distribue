package com.esprit.microservice.aigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.reactive.CorsConfigurationSource;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http, CorsConfigurationSource corsConfigurationSource) {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf.disable())
                .authorizeExchange(auth -> auth
                        .pathMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        // Public: auth endpoints des microservices (via routes du gateway)
                        .pathMatchers("/api/auth/**").permitAll()
                        // Sync profil patient MySQL après inscription (user-service Symfony, sans JWT)
                        .pathMatchers(HttpMethod.POST, "/api/patients/register-profile").permitAll()
                        .pathMatchers("/nephro/api/auth/**").permitAll()
                        // /projet/** est routé sans stripPrefix, donc auth = /projet/api/auth/**
                        .pathMatchers("/projet/api/auth/**").permitAll()
                        .pathMatchers("/projet/auth/**").permitAll()
                        .pathMatchers("/prescription/auth/**").permitAll()
                        // Fichiers statiques (img src / window.open sans header Bearer)
                        .pathMatchers("/uploads/**").permitAll()
                        // Health checks
                        .pathMatchers("/actuator/**").permitAll()
                        // Tout le reste protégé par JWT
                        .anyExchange().authenticated()
                );
        http.oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> {}));
        return http.build();
    }
}