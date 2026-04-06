package com.example.dossiermedicale.Services;

import com.example.dossiermedicale.Entities.ResultatLabtest;
import com.example.dossiermedicale.Enum.SexeNorme;
import com.example.dossiermedicale.Repository.DossierMedicalRepository;
import com.example.dossiermedicale.Repository.PatientRepository;
import com.example.dossiermedicale.Repository.ResultatLabtestRepository;
import com.example.dossiermedicale.dto.ResultatLabtestDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ResultatLabtestService {

    private final ResultatLabtestRepository resultatLabtestRepository;
    private final PrescriptionBilanService prescriptionBilanService;
    private final ModuleLaboService moduleLaboService;
    private final DossierMedicalRepository dossierMedicalRepository;
    private final PatientRepository patientRepository;

    private ResultatLabtestDTO toDTO(ResultatLabtest e) {
        ResultatLabtestDTO dto = new ResultatLabtestDTO();
        dto.setId(e.getId());
        dto.setPrescriptionId(e.getPrescriptionId());
        dto.setDossierId(e.getDossierId());
        dto.setCodeLoinc(e.getCodeLoinc());
        dto.setLibelleExamen(e.getLibelleExamen());
        dto.setValeur(e.getValeur());
        dto.setUnite(e.getUnite());
        dto.setDatePrelevement(e.getDatePrelevement());
        dto.setDateRendu(e.getDateRendu());
        dto.setSource(e.getSource());
        dto.setStatutInterpretation(e.getStatutInterpretation());
        dto.setValideParMedecin(e.getValideParMedecin());
        return dto;
    }

    private ResultatLabtest toEntity(ResultatLabtestDTO dto) {
        return ResultatLabtest.builder()
                .prescriptionId(dto.getPrescriptionId())
                .dossierId(dto.getDossierId())
                .codeLoinc(dto.getCodeLoinc())
                .libelleExamen(dto.getLibelleExamen())
                .valeur(dto.getValeur())
                .unite(dto.getUnite())
                .datePrelevement(dto.getDatePrelevement())
                .dateRendu(dto.getDateRendu() != null ? dto.getDateRendu() : java.time.LocalDateTime.now())
                .source(dto.getSource())
                .statutInterpretation(dto.getStatutInterpretation())
                .valideParMedecin(dto.getValideParMedecin())
                .build();
    }

    /** Crée un résultat, déclenche interprétation auto si âge/sexe fournis, puis alertes critiques. */
    public ResultatLabtestDTO create(ResultatLabtestDTO dto, Integer ageMois, SexeNorme sexe) {
        ResultatLabtest entity = toEntity(dto);
        ResultatLabtest saved = moduleLaboService.enregistrerResultatEtInterpreter(entity, ageMois, sexe);
        if (saved.getPrescriptionId() != null) {
            prescriptionBilanService.mettreAJourStatut(saved.getPrescriptionId());
        }
        return toDTO(saved);
    }

    /** Crée avec interprétation auto si dossier permet de déduire âge (et sexe). */
    public ResultatLabtestDTO create(ResultatLabtestDTO dto) {
        Integer ageMois = dto.getDossierId() != null ? ageMoisFromDossier(dto.getDossierId()).orElse(null) : null;
        SexeNorme sexe = dto.getDossierId() != null ? sexeFromDossier(dto.getDossierId()).orElse(SexeNorme.TOUS) : SexeNorme.TOUS;
        return create(dto, ageMois, sexe);
    }

    /** Valide un résultat (médecin). */
    public ResultatLabtestDTO validerParMedecin(Long resultatId, Long medecinId) {
        ResultatLabtest r = resultatLabtestRepository.findById(resultatId).orElseThrow(() -> new RuntimeException("Résultat non trouvé: " + resultatId));
        r.setValideParMedecin(medecinId);
        return toDTO(resultatLabtestRepository.save(r));
    }

    @Transactional(readOnly = true)
    public ResultatLabtestDTO getById(Long id) {
        return toDTO(resultatLabtestRepository.findById(id).orElseThrow(() -> new RuntimeException("Résultat non trouvé: " + id)));
    }

    @Transactional(readOnly = true)
    public List<ResultatLabtestDTO> getByPrescription(Long prescriptionId) {
        return resultatLabtestRepository.findByPrescriptionIdOrderByDateRenduDesc(prescriptionId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ResultatLabtestDTO> getByDossier(Long dossierId) {
        return resultatLabtestRepository.findByDossierIdOrderByDateRenduDesc(dossierId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    /** Pour interprétation : âge en mois à partir du dossier. */
    public Optional<Integer> ageMoisFromDossier(Long dossierId) {
        return dossierMedicalRepository.findById(dossierId)
                .map(d -> patientRepository.findById(d.getIdPatient()).orElse(null))
                .filter(p -> p != null && p.getDateNaissance() != null)
                .map(p -> moduleLaboService.ageEnMois(p.getDateNaissance()));
    }

    public Optional<SexeNorme> sexeFromDossier(Long dossierId) {
        // Si un jour le patient a un champ sexe, le lire ici. Pour l'instant on retourne TOUS.
        return Optional.of(SexeNorme.TOUS);
    }
}
