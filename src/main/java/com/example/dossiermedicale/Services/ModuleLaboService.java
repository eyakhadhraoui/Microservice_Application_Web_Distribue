package com.example.dossiermedicale.Services;

import com.example.dossiermedicale.Entities.*;
import com.example.dossiermedicale.Enum.*;
import com.example.dossiermedicale.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

/**
 * Module 4 : Prescription → Résultats labo → Interprétation automatique → Validation → Rapport → Famille.
 * - interpreterAutomatique : compare aux normes pédiatriques (âge, sexe) → NORMAL / ÉLEVÉ / BAS / CRITIQUE.
 * - calculerDFGEstime : formule de Schwartz (néphro pédiatrique).
 * - declencherAlertesCritiques : hyperkaliémie, DFG &lt; 30, protéinurie, hyponatrémie.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ModuleLaboService {

    private final PrescriptionBilanRepository prescriptionBilanRepository;
    private final ResultatLabtestRepository resultatLabtestRepository;
    private final NormePediatriqueLaboRepository normePediatriqueLaboRepository;
    private final RapportBilanRepository rapportBilanRepository;
    private final AlerteLaboRepository alerteLaboRepository;
    private final DossierMedicalRepository dossierMedicalRepository;
    private final PatientRepository patientRepository;
    private final NotificationMedecinService notificationMedecinService;

    // ——— Constantes formule de Schwartz (k selon âge) ———
    private static final double K_PREMATURE = 0.33;
    private static final double K_NOURRISSON = 0.45;
    private static final double K_ENFANT = 0.55;
    private static final double K_ADO_GARCON = 0.70;
    private static final double K_ADO_FILLE = 0.55;

    // ——— Seuils alertes critiques (si pas de norme en base) ———
    private static final double SEUIL_KALIEMIE_HAUT = 6.5;   // mmol/L
    private static final double SEUIL_DFG_BAS = 30;          // mL/min/1.73m²
    private static final double SEUIL_PROTEINURIE_HAUT = 3;   // g/g
    private static final double SEUIL_NATREMIE_BAS = 125;    // mmol/L

    /**
     * Interprétation automatique d'un résultat : recherche des normes (âge en mois, sexe), classe en NORMAL / ELEVE / BAS / CRITIQUE_HAUT / CRITIQUE_BAS.
     */
    @Transactional
    public ResultatLabtest interpreterAutomatique(Long resultatId, int ageMois, SexeNorme sexe) {
        ResultatLabtest r = resultatLabtestRepository.findById(resultatId)
                .orElseThrow(() -> new RuntimeException("Résultat labtest non trouvé: " + resultatId));
        if (r.getValeur() == null) return r;

        List<NormePediatriqueLabo> normes = normePediatriqueLaboRepository.findApplicable(r.getCodeLoinc(), ageMois, sexe);
        if (normes.isEmpty()) {
            r.setStatutInterpretation(StatutInterpretation.NORMAL);
            return resultatLabtestRepository.save(r);
        }
        NormePediatriqueLabo norme = normes.get(0);
        BigDecimal v = r.getValeur();
        StatutInterpretation statut = StatutInterpretation.NORMAL;

        if (norme.getSeuilCritiqueBas() != null && v.compareTo(norme.getSeuilCritiqueBas()) < 0) {
            statut = StatutInterpretation.CRITIQUE_BAS;
        } else if (norme.getSeuilCritiqueHaut() != null && v.compareTo(norme.getSeuilCritiqueHaut()) > 0) {
            statut = StatutInterpretation.CRITIQUE_HAUT;
        } else if (norme.getValeurMinNormale() != null && v.compareTo(norme.getValeurMinNormale()) < 0) {
            statut = StatutInterpretation.BAS;
        } else if (norme.getValeurMaxNormale() != null && v.compareTo(norme.getValeurMaxNormale()) > 0) {
            statut = StatutInterpretation.ELEVE;
        }
        r.setStatutInterpretation(statut);
        return resultatLabtestRepository.save(r);
    }

    /**
     * Formule de Schwartz : DFG (mL/min/1.73m²) = (k × taille cm) / créatinine µmol/L.
     * k : 0.33 prématuré, 0.45 nourrisson, 0.55 enfant, 0.70 ado garçon, 0.55 ado fille.
     */
    public BigDecimal calculerDFGEstime(BigDecimal tailleCm, BigDecimal creatinineUmolL, int ageMois, boolean garcon) {
        if (tailleCm == null || creatinineUmolL == null || creatinineUmolL.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        double k;
        if (ageMois < 12) k = ageMois < 3 ? K_PREMATURE : K_NOURRISSON;
        else if (ageMois < 180) k = K_ENFANT; // < 15 ans
        else k = garcon ? K_ADO_GARCON : K_ADO_FILLE;
        BigDecimal dfg = tailleCm.multiply(BigDecimal.valueOf(k)).divide(creatinineUmolL, 2, RoundingMode.HALF_UP);
        return dfg;
    }

    /**
     * Déclenche les alertes critiques en temps réel : hyperkaliémie &gt; 6.5, DFG &lt; 30, protéinurie &gt; 3 g/g, hyponatrémie &lt; 125.
     */
    @Transactional
    public void declencherAlertesCritiques(ResultatLabtest resultat) {
        if (resultat == null || resultat.getValeur() == null) return;
        String code = resultat.getCodeLoinc() != null ? resultat.getCodeLoinc().toUpperCase() : "";
        BigDecimal v = resultat.getValeur();
        String msg = null;
        TypeAlerteLabo type = TypeAlerteLabo.CRITIQUE;

        if (code.contains("K") || "2823-3".equals(resultat.getCodeLoinc()) || "KALIEMIE".equalsIgnoreCase(resultat.getLibelleExamen())) {
            if (v.doubleValue() > SEUIL_KALIEMIE_HAUT) {
                msg = "Kaliémie critique : " + v + " mmol/L — risque arythmie";
            }
        } else if (code.contains("DFG") || "33914-3".equals(resultat.getCodeLoinc()) || "DFG".equalsIgnoreCase(resultat.getLibelleExamen())) {
            if (v.doubleValue() < SEUIL_DFG_BAS) {
                msg = "DFG critique : " + v + " mL/min/1.73m² — insuffisance rénale sévère";
            }
        } else if (code.contains("PROTEIN") || "2888-6".equals(resultat.getCodeLoinc()) || "PROTEINURIE".equalsIgnoreCase(resultat.getLibelleExamen())) {
            if (v.doubleValue() > SEUIL_PROTEINURIE_HAUT) {
                msg = "Protéinurie critique : " + v + " g/g";
            }
        } else if (code.contains("NA") || "2951-2".equals(resultat.getCodeLoinc()) || "NATREMIE".equalsIgnoreCase(resultat.getLibelleExamen())) {
            if (v.doubleValue() < SEUIL_NATREMIE_BAS) {
                msg = "Hyponatrémie critique : " + v + " mmol/L";
            }
        }

        if (msg != null) {
            AlerteLabo alerte = AlerteLabo.builder()
                    .resultatId(resultat.getId())
                    .typeAlerte(type)
                    .message(msg)
                    .build();
            alerteLaboRepository.save(alerte);
            notifierMedecinAlerteLabo(resultat.getDossierId(), resultat.getId(), msg);
        }
    }

    private void notifierMedecinAlerteLabo(Long dossierId, Long resultatId, String message) {
        Optional<DossierMedical> dossierOpt = dossierMedicalRepository.findById(dossierId);
        if (dossierOpt.isEmpty() || dossierOpt.get().getIdMedecin() == null) return;
        String nomPatient = "";
        Optional<Patient> pOpt = patientRepository.findById(dossierOpt.get().getIdPatient());
        if (pOpt.isPresent()) {
            Patient p = pOpt.get();
            nomPatient = (p.getFirstName() != null ? p.getFirstName() : "") + " " + (p.getLastName() != null ? p.getLastName() : "").trim();
        }
        notificationMedecinService.creerPourAlerteLabo(
                dossierOpt.get().getIdMedecin(),
                dossierId,
                resultatId,
                nomPatient,
                message
        );
    }

    /** Enregistre un résultat (HL7, OCR, saisie), interprète automatiquement si dossier/patient connus, puis déclenche alertes si critique. */
    @Transactional
    public ResultatLabtest enregistrerResultatEtInterpreter(ResultatLabtest resultat, Integer ageMois, SexeNorme sexe) {
        ResultatLabtest saved = resultatLabtestRepository.save(resultat);
        if (ageMois != null && sexe != null) {
            interpreterAutomatique(saved.getId(), ageMois, sexe);
            saved = resultatLabtestRepository.findById(saved.getId()).orElse(saved);
        }
        declencherAlertesCritiques(saved);
        return saved;
    }

    /** Calcule l'âge en mois à partir de la date de naissance. */
    public int ageEnMois(LocalDate dateNaissance) {
        if (dateNaissance == null) return 0;
        return (int) ChronoUnit.MONTHS.between(dateNaissance, LocalDate.now());
    }

    /** Acquitter une alerte labo (médecin prend en charge). */
    @Transactional
    public void acquitterAlerte(Long alerteId, Long medecinId, String actionRealisee) {
        AlerteLabo a = alerteLaboRepository.findById(alerteId).orElseThrow(() -> new RuntimeException("Alerte non trouvée: " + alerteId));
        a.setAcquitteePar(medecinId);
        a.setDateAcquittement(LocalDateTime.now());
        a.setActionRealisee(actionRealisee);
        alerteLaboRepository.save(a);
    }
}
