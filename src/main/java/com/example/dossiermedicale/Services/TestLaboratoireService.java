package com.example.dossiermedicale.Services;

import com.example.dossiermedicale.Entities.TestLaboratoire;
import com.example.dossiermedicale.Enum.TypeTestLaboratoire;
import com.example.dossiermedicale.Repository.TestLaboratoireRepository;
import com.example.dossiermedicale.dto.TestLaboratoireDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TestLaboratoireService {

    private final TestLaboratoireRepository testLaboratoireRepository;

    private TestLaboratoireDTO toDTO(TestLaboratoire entity) {
        TestLaboratoireDTO dto = new TestLaboratoireDTO();
        dto.setIdTestLaboratoire(entity.getIdTestLaboratoire());
        dto.setCodeTest(entity.getCodeTest());
        dto.setNomTest(entity.getNomTest());
        dto.setCategorie(entity.getCategorie());
        dto.setCodeLoinc(entity.getCodeLoinc());
        dto.setTypeEchantillon(entity.getTypeEchantillon());
        dto.setUnite(entity.getUnite());
        dto.setValeursNormales(entity.getValeursNormales());
        dto.setMethodeAnalyse(entity.getMethodeAnalyse());
        dto.setPrix(entity.getPrix());
        return dto;
    }

    private TestLaboratoire toEntity(TestLaboratoireDTO dto) {
        TestLaboratoire entity = new TestLaboratoire();
        if (dto.getIdTestLaboratoire() != null) {
            entity.setIdTestLaboratoire(dto.getIdTestLaboratoire());
        }
        entity.setCodeTest(dto.getCodeTest() != null ? dto.getCodeTest().trim() : null);
        entity.setNomTest(dto.getNomTest() != null ? dto.getNomTest().trim() : null);
        entity.setCategorie(dto.getCategorie() != null && !dto.getCategorie().isBlank() ? dto.getCategorie().trim() : null);
        entity.setCodeLoinc(dto.getCodeLoinc() != null && !dto.getCodeLoinc().isBlank() ? dto.getCodeLoinc().trim() : null);
        entity.setTypeEchantillon(dto.getTypeEchantillon() != null && !dto.getTypeEchantillon().isBlank() ? dto.getTypeEchantillon().trim() : null);
        entity.setUnite(dto.getUnite() != null && !dto.getUnite().isBlank() ? dto.getUnite().trim() : null);
        entity.setValeursNormales(dto.getValeursNormales() != null && !dto.getValeursNormales().isBlank() ? dto.getValeursNormales().trim() : null);
        entity.setMethodeAnalyse(dto.getMethodeAnalyse() != null && !dto.getMethodeAnalyse().isBlank() ? dto.getMethodeAnalyse().trim() : null);
        entity.setPrix(dto.getPrix());
        return entity;
    }

    public TestLaboratoireDTO create(TestLaboratoireDTO dto) {
        if (dto.getCodeTest() == null || dto.getCodeTest().isBlank()) {
            throw new IllegalArgumentException("Le code du test est obligatoire");
        }
        if (dto.getNomTest() == null || dto.getNomTest().isBlank()) {
            throw new IllegalArgumentException("Le nom du test est obligatoire");
        }
        String code = dto.getCodeTest().trim();
        if (testLaboratoireRepository.existsByCodeTest(code)) {
            throw new IllegalArgumentException("Un test avec le code " + code + " existe déjà");
        }
        TestLaboratoire entity = toEntity(dto);
        entity.setIdTestLaboratoire(null);
        TestLaboratoire saved = testLaboratoireRepository.save(entity);
        return toDTO(saved);
    }

    public TestLaboratoireDTO update(Long id, TestLaboratoireDTO dto) {
        TestLaboratoire entity = testLaboratoireRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Test laboratoire non trouvé avec l'ID: " + id));
        entity.setCodeTest(dto.getCodeTest());
        entity.setNomTest(dto.getNomTest());
        entity.setCategorie(dto.getCategorie());
        entity.setCodeLoinc(dto.getCodeLoinc());
        entity.setTypeEchantillon(dto.getTypeEchantillon());
        entity.setUnite(dto.getUnite());
        entity.setValeursNormales(dto.getValeursNormales());
        entity.setMethodeAnalyse(dto.getMethodeAnalyse());
        entity.setPrix(dto.getPrix());
        return toDTO(testLaboratoireRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public TestLaboratoireDTO getById(Long id) {
        TestLaboratoire entity = testLaboratoireRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Test laboratoire non trouvé avec l'ID: " + id));
        return toDTO(entity);
    }

    @Transactional(readOnly = true)
    public List<TestLaboratoireDTO> getAll() {
        return testLaboratoireRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public void delete(Long id) {
        if (!testLaboratoireRepository.existsById(id)) {
            throw new RuntimeException("Test laboratoire non trouvé avec l'ID: " + id);
        }
        testLaboratoireRepository.deleteById(id);
    }

    /**
     * Initialise le catalogue à partir de l'enum TypeTestLaboratoire.
     * Crée les entrées manquantes au démarrage.
     */
    @Transactional
    public void seedFromEnum() {
        for (TypeTestLaboratoire type : TypeTestLaboratoire.values()) {
            if (!testLaboratoireRepository.existsByCodeTest(type.getCode())) {
                TestLaboratoire entity = new TestLaboratoire();
                entity.setCodeTest(type.getCode());
                entity.setNomTest(type.getNom());
                entity.setCategorie(type.getCategorie());
                if (type.getCodeLoinc() != null) entity.setCodeLoinc(type.getCodeLoinc());
                if (type.getUnite() != null) entity.setUnite(type.getUnite());
                entity.setNecessiteJeune(Boolean.FALSE);
                testLaboratoireRepository.save(entity);
            }
        }
    }
}
