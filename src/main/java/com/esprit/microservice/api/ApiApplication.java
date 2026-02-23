package com.esprit.microservice.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.web.reactive.function.client.WebClient;

@SpringBootApplication
@EnableDiscoveryClient
public class ApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiApplication.class, args);
    }
    @Bean
    public RouteLocator gatewayRoutes(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("PRESCRIPTION_SERVICE", r -> r.path("/prescription/**")
                        .filters(f -> f.stripPrefix(1))
                        .uri("lb://prescription-service"))
                .route("INFECTION_SERVICE", r -> r.path("/infection/**")
                        .filters(f -> f.stripPrefix(1))
                        .uri("lb://INFECTIONETVACCINATION"))
                .route("CONSULTATION_SERVICE", r -> r.path("/consultation/**")
                        .filters(f -> f.stripPrefix(1))
                        .uri("lb://consultation2"))
                .route("HOSPITALISATION_SERVICE", r -> r.path("/hospitalisation/**")
                        .filters(f -> f.stripPrefix(1))
                        .uri("lb://Hospitalisation"))
                .route("NEPHRO_SERVICE", r -> r.path("/nephro/**")
                        .filters(f -> f.stripPrefix(1))
                        .uri("lb://NEPHRO"))
                .build();

    }

}