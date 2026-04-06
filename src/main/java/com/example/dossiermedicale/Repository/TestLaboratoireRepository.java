package com.example.dossiermedicale.Repository;

import com.example.dossiermedicale.Entities.TestLaboratoire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TestLaboratoireRepository extends JpaRepository<TestLaboratoire, Long> {

    Optional<TestLaboratoire> findByCodeTest(String codeTest);

    boolean existsByCodeTest(String codeTest);
}
