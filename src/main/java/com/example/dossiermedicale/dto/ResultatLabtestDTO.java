package com.example.dossiermedicale.dto;

import com.example.dossiermedicale.Enum.SourceResultat;
import com.example.dossiermedicale.Enum.StatutInterpretation;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResultatLabtestDTO {
    private Long id;
    private Long prescriptionId;
    private Long dossierId;
    private String codeLoinc;
    private String libelleExamen;
    private BigDecimal valeur;
    private String unite;
    private LocalDateTime datePrelevement;
    private LocalDateTime dateRendu;
    private SourceResultat source;
    private StatutInterpretation statutInterpretation;
    private Long valideParMedecin;
}
