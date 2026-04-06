package com.example.dossiermedicale.config;

import com.example.dossiermedicale.Services.TestLaboratoireService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class TestLaboratoireSeeder implements ApplicationRunner {

    private final TestLaboratoireService testLaboratoireService;

    public TestLaboratoireSeeder(TestLaboratoireService testLaboratoireService) {
        this.testLaboratoireService = testLaboratoireService;
    }

    @Override
    public void run(ApplicationArguments args) {
        testLaboratoireService.seedFromEnum();
    }
}
