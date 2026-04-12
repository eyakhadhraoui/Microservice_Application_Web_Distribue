package org.example.infectionetvaccination;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.web.bind.annotation.CrossOrigin;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@CrossOrigin(origins = "http://localhost:4200")
public class InfectionEtVaccinationApplication {

    public static void main(String[] args) {
        SpringApplication.run(InfectionEtVaccinationApplication.class, args);
    }

}
