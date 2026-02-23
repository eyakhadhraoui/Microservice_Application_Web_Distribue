package com.example.NEPHRO;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@EnableDiscoveryClient
@SpringBootApplication
public class NephroApplication {

	public static void main(String[] args) {
		SpringApplication.run(NephroApplication.class, args);
	}

}
