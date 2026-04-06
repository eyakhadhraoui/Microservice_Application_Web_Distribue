package com.example.dossiermedicale.Repository;

import com.example.dossiermedicale.Entities.NoteInterne;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteInterneRepository extends JpaRepository<NoteInterne, Long> {

    List<NoteInterne> findByDossierMedicalIdDossierMedicalOrderByDateCreationDesc(Long idDossierMedical);
}
