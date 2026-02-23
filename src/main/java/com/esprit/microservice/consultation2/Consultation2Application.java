package com.esprit.microservice.consultation2;

import com.esprit.microservice.consultation2.Repository.IConsultationRepo;
import com.esprit.microservice.consultation2.entity.Consultation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.Date;

@SpringBootApplication
public class Consultation2Application {

    public static void main(String[] args) {
        SpringApplication.run(Consultation2Application.class, args);
    }

    @Bean
    CommandLineRunner start(IConsultationRepo consultationRepo) {
        return args -> {

            Consultation c1 = new Consultation();
            c1.setDateConsultation(new Date());
            c1.setDiagnostic("Grippe");
            c1.setNotes("Patient avec fièvre");
            c1.setIdDossiermedical(1);

            Consultation c2 = new Consultation();
            c2.setDateConsultation(new Date());
            c2.setDiagnostic("Allergie");
            c2.setNotes("Réaction allergique saisonnière");
            c2.setIdDossiermedical(2);

            Consultation c3 = new Consultation();
            c3.setDateConsultation(new Date());
            c3.setDiagnostic("Contrôle général");
            c3.setNotes("Consultation de routine");
            c3.setIdDossiermedical(3);

            consultationRepo.save(c1);
            consultationRepo.save(c2);
            consultationRepo.save(c3);

            System.out.println("✅ Données de test insérées dans H2 !");
        };
    }
}