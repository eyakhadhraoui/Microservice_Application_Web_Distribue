package com.example.dossiermedicale.Services;

import com.example.dossiermedicale.Entities.DossierMedical;
import com.example.dossiermedicale.Entities.Patient;
import com.example.dossiermedicale.Entities.ResultatLaboratoire;
import com.example.dossiermedicale.Entities.TestLaboratoire;
import com.example.dossiermedicale.Enum.StatutResultat;
import com.example.dossiermedicale.Repository.DossierMedicalRepository;
import com.example.dossiermedicale.Repository.PatientRepository;
import com.example.dossiermedicale.Repository.ResultatLaboratoireRepository;
import com.example.dossiermedicale.Repository.TestLaboratoireRepository;
import com.example.dossiermedicale.dto.ResultatLaboratoireDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ResultatLaboratoireService {

    private final ResultatLaboratoireRepository resultatLaboratoireRepository;
    private final DossierMedicalRepository dossierMedicalRepository;
    private final TestLaboratoireRepository testLaboratoireRepository;
    private final PatientRepository patientRepository;
    private final NotificationMedecinService notificationMedecinService;

    private ResultatLaboratoireDTO toDTO(ResultatLaboratoire entity) {
        ResultatLaboratoireDTO dto = new ResultatLaboratoireDTO();
        dto.setIdResultatLaboratoire(entity.getIdResultatLaboratoire());
        dto.setIdDossierMedical(entity.getDossierMedical() != null ? entity.getDossierMedical().getIdDossierMedical() : null);
        dto.setIdTestLaboratoire(entity.getTestLaboratoire() != null ? entity.getTestLaboratoire().getIdTestLaboratoire() : null);
        dto.setDatePrelevement(entity.getDatePrelevement());
        dto.setDateRendu(entity.getDateRendu());
        dto.setDateResultat(entity.getDateResultat());
        dto.setValeurNumerique(entity.getValeurNumerique());
        dto.setValeurTexte(entity.getValeurTexte());
        dto.setValeurResultat(entity.getValeurResultat());
        dto.setUnite(entity.getUnite());
        dto.setConclusion(entity.getConclusion());
        dto.setStatutResultat(entity.getStatutResultat());
        dto.setInterpretation(entity.getInterpretation());
        dto.setSourceImport(entity.getSourceImport());
        dto.setValideParMedecin(entity.getValideParMedecin());
        dto.setDateValidation(entity.getDateValidation());
        dto.setPartagePatient(entity.getPartagePatient());
        dto.setEtat(entity.getEtat());
        if (entity.getTestLaboratoire() != null) {
            dto.setNomTest(entity.getTestLaboratoire().getNomTest());
            dto.setCodeTest(entity.getTestLaboratoire().getCodeTest());
        }
        return dto;
    }

    private ResultatLaboratoire toEntity(ResultatLaboratoireDTO dto) {
        ResultatLaboratoire entity = new ResultatLaboratoire();
        DossierMedical dossier = dossierMedicalRepository.findById(dto.getIdDossierMedical())
                .orElseThrow(() -> new RuntimeException("Dossier médical non trouvé: " + dto.getIdDossierMedical()));
        TestLaboratoire test = testLaboratoireRepository.findById(dto.getIdTestLaboratoire())
                .orElseThrow(() -> new RuntimeException("Test laboratoire non trouvé: " + dto.getIdTestLaboratoire()));
        entity.setDossierMedical(dossier);
        entity.setTestLaboratoire(test);
        entity.setDatePrelevement(dto.getDatePrelevement());
        entity.setDateRendu(dto.getDateRendu());
        entity.setDateResultat(dto.getDateResultat());
        entity.setValeurNumerique(dto.getValeurNumerique());
        entity.setValeurTexte(dto.getValeurTexte());
        entity.setValeurResultat(dto.getValeurResultat());
        entity.setUnite(dto.getUnite());
        entity.setConclusion(dto.getConclusion());
        entity.setStatutResultat(dto.getStatutResultat() != null ? dto.getStatutResultat() : StatutResultat.EN_ATTENTE);
        entity.setInterpretation(dto.getInterpretation());
        entity.setSourceImport(dto.getSourceImport());
        entity.setValideParMedecin(dto.getValideParMedecin());
        entity.setDateValidation(dto.getDateValidation());
        entity.setPartagePatient(dto.getPartagePatient() != null ? dto.getPartagePatient() : false);
        entity.setEtat(dto.getEtat());
        return entity;
    }

    public ResultatLaboratoireDTO create(ResultatLaboratoireDTO dto) {
        ResultatLaboratoire saved = resultatLaboratoireRepository.save(toEntity(dto));
        notifierMedecinNouveauTestLabo(saved);
        return toDTO(saved);
    }

    private void notifierMedecinNouveauTestLabo(ResultatLaboratoire resultat) {
        DossierMedical dossier = resultat.getDossierMedical();
        if (dossier == null || dossier.getIdMedecin() == null) return;
        String nomPatient = "";
        if (dossier.getIdPatient() != null) {
            Optional<Patient> opt = patientRepository.findById(dossier.getIdPatient());
            if (opt.isPresent()) {
                Patient p = opt.get();
                nomPatient = (p.getFirstName() != null ? p.getFirstName() : "") + " " + (p.getLastName() != null ? p.getLastName() : "").trim();
            }
        }
        String nomTest = resultat.getTestLaboratoire() != null ? resultat.getTestLaboratoire().getNomTest() : null;
        String dateStr = resultat.getDateRendu() != null ? resultat.getDateRendu().toString() : (resultat.getDateResultat() != null ? resultat.getDateResultat().toString() : null);
        notificationMedecinService.creerPourNouveauTestLabo(
                dossier.getIdMedecin(),
                dossier.getIdDossierMedical(),
                resultat.getIdResultatLaboratoire(),
                nomPatient,
                nomTest,
                dateStr
        );
    }

    public ResultatLaboratoireDTO update(Long id, ResultatLaboratoireDTO dto) {
        ResultatLaboratoire entity = resultatLaboratoireRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Résultat laboratoire non trouvé avec l'ID: " + id));
        DossierMedical dossier = dossierMedicalRepository.findById(dto.getIdDossierMedical())
                .orElseThrow(() -> new RuntimeException("Dossier médical non trouvé: " + dto.getIdDossierMedical()));
        TestLaboratoire test = testLaboratoireRepository.findById(dto.getIdTestLaboratoire())
                .orElseThrow(() -> new RuntimeException("Test laboratoire non trouvé: " + dto.getIdTestLaboratoire()));
        entity.setDossierMedical(dossier);
        entity.setTestLaboratoire(test);
        entity.setDatePrelevement(dto.getDatePrelevement());
        entity.setDateRendu(dto.getDateRendu());
        entity.setDateResultat(dto.getDateResultat());
        entity.setValeurNumerique(dto.getValeurNumerique());
        entity.setValeurTexte(dto.getValeurTexte());
        entity.setValeurResultat(dto.getValeurResultat());
        entity.setUnite(dto.getUnite());
        entity.setConclusion(dto.getConclusion());
        if (dto.getStatutResultat() != null) entity.setStatutResultat(dto.getStatutResultat());
        entity.setInterpretation(dto.getInterpretation());
        entity.setSourceImport(dto.getSourceImport());
        entity.setValideParMedecin(dto.getValideParMedecin());
        entity.setDateValidation(dto.getDateValidation());
        if (dto.getPartagePatient() != null) entity.setPartagePatient(dto.getPartagePatient());
        entity.setEtat(dto.getEtat());
        return toDTO(resultatLaboratoireRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public ResultatLaboratoireDTO getById(Long id) {
        ResultatLaboratoire entity = resultatLaboratoireRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Résultat laboratoire non trouvé avec l'ID: " + id));
        return toDTO(entity);
    }

    @Transactional(readOnly = true)
    public List<ResultatLaboratoireDTO> getAll() {
        return resultatLaboratoireRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ResultatLaboratoireDTO> getByDossier(Long idDossierMedical) {
        return resultatLaboratoireRepository.findByDossierMedicalIdDossierMedicalOrderByDateResultatDesc(idDossierMedical)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ResultatLaboratoireDTO> getByDateRange(LocalDate dateDebut, LocalDate dateFin) {
        return resultatLaboratoireRepository.findByDateResultatBetween(dateDebut, dateFin)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public void delete(Long id) {
        if (!resultatLaboratoireRepository.existsById(id)) {
            throw new RuntimeException("Résultat laboratoire non trouvé avec l'ID: " + id);
        }
        resultatLaboratoireRepository.deleteById(id);
    }
}
