package com.example.dossiermedicale.Repository;

import com.example.dossiermedicale.Entities.NotificationMedecin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationMedecinRepository extends JpaRepository<NotificationMedecin, Long> {

    /** Pour le dashboard : toutes les notifications du médecin, les plus récentes en premier. */
    List<NotificationMedecin> findByIdMedecinOrderByDateCreationDesc(Long idMedecin);

    /** Non lues uniquement (badge / compteur). */
    List<NotificationMedecin> findByIdMedecinAndLuFalseOrderByDateCreationDesc(Long idMedecin);

    long countByIdMedecinAndLuFalse(Long idMedecin);
}
