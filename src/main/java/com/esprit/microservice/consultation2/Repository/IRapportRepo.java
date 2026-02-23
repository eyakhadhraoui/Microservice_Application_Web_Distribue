package com.esprit.microservice.consultation2.Repository;

import com.esprit.microservice.consultation2.entity.Rapport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IRapportRepo extends JpaRepository<Rapport,Integer> {
}
