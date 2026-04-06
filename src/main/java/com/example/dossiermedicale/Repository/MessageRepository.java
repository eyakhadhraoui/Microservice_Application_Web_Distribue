package com.example.dossiermedicale.Repository;

import com.example.dossiermedicale.Entities.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByDossierMedicalIdDossierMedicalOrderByDateEnvoiAsc(Long idDossierMedical);
}
