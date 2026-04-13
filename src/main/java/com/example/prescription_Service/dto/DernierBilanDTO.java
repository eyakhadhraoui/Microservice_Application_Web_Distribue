package com.example.prescription_Service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;

public class DernierBilanDTO {

    @JsonProperty("id_patient")
    private Long idPatient;

    @JsonProperty("id_dossier_medical")
    private Long idDossierMedical;

    private Double poids;
    private Double taille;
    private String diagnostic;

    @JsonProperty("date_dernier_bilan")
    private LocalDate dateDernierBilan;

    private Double potassium;
    private Double sodium;
    private Double phosphore;
    private Double creatinine;
    private Double dfg;
    private Double albumine;
    private Double glycemie;
    private Double proteinurie;

    public DernierBilanDTO() {}

    public Long getIdPatient()                          { return idPatient; }
    public void setIdPatient(Long v)                    { this.idPatient = v; }

    public Long getIdDossierMedical()                   { return idDossierMedical; }
    public void setIdDossierMedical(Long v)             { this.idDossierMedical = v; }

    public Double getPoids()                            { return poids; }
    public void setPoids(Double v)                      { this.poids = v; }

    public Double getTaille()                           { return taille; }
    public void setTaille(Double v)                     { this.taille = v; }

    public String getDiagnostic()                       { return diagnostic; }
    public void setDiagnostic(String v)                 { this.diagnostic = v; }

    public LocalDate getDateDernierBilan()              { return dateDernierBilan; }
    public void setDateDernierBilan(LocalDate v)        { this.dateDernierBilan = v; }

    public Double getPotassium()                        { return potassium; }
    public void setPotassium(Double v)                  { this.potassium = v; }

    public Double getSodium()                           { return sodium; }
    public void setSodium(Double v)                     { this.sodium = v; }

    public Double getPhosphore()                        { return phosphore; }
    public void setPhosphore(Double v)                  { this.phosphore = v; }

    public Double getCreatinine()                       { return creatinine; }
    public void setCreatinine(Double v)                 { this.creatinine = v; }

    public Double getDfg()                              { return dfg; }
    public void setDfg(Double v)                        { this.dfg = v; }

    public Double getAlbumine()                         { return albumine; }
    public void setAlbumine(Double v)                   { this.albumine = v; }

    public Double getGlycemie()                         { return glycemie; }
    public void setGlycemie(Double v)                   { this.glycemie = v; }

    public Double getProteinurie()                      { return proteinurie; }
    public void setProteinurie(Double v)                { this.proteinurie = v; }
}
