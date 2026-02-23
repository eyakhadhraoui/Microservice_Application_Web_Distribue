package org.example.hospitalisation.Repo;

import org.example.hospitalisation.Entities.Hospitalization;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IHospitalizationRepo extends JpaRepository<Hospitalization, Long> {

}
