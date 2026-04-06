package com.example.dossiermedicale.Repository;

import com.example.dossiermedicale.Entities.Medecin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MedecinRepository extends JpaRepository<Medecin, Long> {

    Optional<Medecin> findByUsername(String username);

    boolean existsByUsername(String username);
}
