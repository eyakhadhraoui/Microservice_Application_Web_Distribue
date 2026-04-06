package com.example.dossiermedicale.Repository;

import com.example.dossiermedicale.Entities.NormePediatriqueLabo;
import com.example.dossiermedicale.Enum.SexeNorme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NormePediatriqueLaboRepository extends JpaRepository<NormePediatriqueLabo, Long> {

    /** Trouver la norme applicable : âge en mois dans [age_min, age_max], sexe = F/M ou TOUS. */
    @Query("SELECT n FROM NormePediatriqueLabo n WHERE n.codeLoinc = :codeLoinc " +
           "AND :ageMois >= n.ageMinMois AND :ageMois <= n.ageMaxMois " +
           "AND (n.sexe = com.example.dossiermedicale.Enum.SexeNorme.TOUS OR n.sexe = :sexe)")
    List<NormePediatriqueLabo> findApplicable(@Param("codeLoinc") String codeLoinc,
                                              @Param("ageMois") int ageMois,
                                              @Param("sexe") SexeNorme sexe);

    List<NormePediatriqueLabo> findByCodeLoincOrderByAgeMinMois(String codeLoinc);
}
