package org.example.hospitalisation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class HospitalisationApplication {

    public static void main(String[] args) {
        SpringApplication.run(HospitalisationApplication.class, args);
    }

}
