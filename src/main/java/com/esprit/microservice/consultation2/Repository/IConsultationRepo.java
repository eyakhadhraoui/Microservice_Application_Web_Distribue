package com.esprit.microservice.consultation2.Repository;

import com.esprit.microservice.consultation2.entity.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IConsultationRepo extends JpaRepository<Consultation,Integer> {
}
