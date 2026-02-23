package com.esprit.microservice.consultation2.Repository;

import com.esprit.microservice.consultation2.entity.Rendezvous;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IRendezvousRepo extends JpaRepository<Rendezvous,Integer> {
}
