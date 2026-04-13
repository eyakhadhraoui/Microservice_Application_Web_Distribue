package com.example.prescription_Service.controller;

import com.example.prescription_Service.dto.DernierBilanDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bilan")
@RequiredArgsConstructor
public class BilanController {

    private final JdbcTemplate jdbcTemplate;

    /**
     * GET /api/bilan/patient/{patientId}/dernier
     * Lit directement la vue dernier_bilan_par_patient via JDBC (pas d'entité JPA).
     */
    @GetMapping("/patient/{patientId}/dernier")
    public ResponseEntity<DernierBilanDTO> getDernierBilan(@PathVariable Long patientId) {
        String sql = "SELECT * FROM dernier_bilan_par_patient WHERE id_patient = ? LIMIT 1";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, patientId);

        if (rows.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> row = rows.get(0);
        DernierBilanDTO dto = new DernierBilanDTO();
        dto.setIdPatient(toLong(row.get("id_patient")));
        dto.setIdDossierMedical(toLong(row.get("id_dossier_medical")));
        dto.setPoids(toDouble(row.get("poids")));
        dto.setTaille(toDouble(row.get("taille")));
        dto.setDiagnostic((String) row.get("diagnostic"));
        dto.setDateDernierBilan(toLocalDate(row.get("date_dernier_bilan")));
        dto.setPotassium(toDouble(row.get("potassium")));
        dto.setSodium(toDouble(row.get("sodium")));
        dto.setPhosphore(toDouble(row.get("phosphore")));
        dto.setCreatinine(toDouble(row.get("creatinine")));
        dto.setDfg(toDouble(row.get("dfg")));
        dto.setAlbumine(toDouble(row.get("albumine")));
        dto.setGlycemie(toDouble(row.get("glycemie")));
        dto.setProteinurie(toDouble(row.get("proteinurie")));

        return ResponseEntity.ok(dto);
    }

    private Long toLong(Object val) {
        if (val == null) return null;
        return ((Number) val).longValue();
    }

    private Double toDouble(Object val) {
        if (val == null) return null;
        return ((Number) val).doubleValue();
    }

    private LocalDate toLocalDate(Object val) {
        if (val == null) return null;
        if (val instanceof LocalDate) return (LocalDate) val;
        if (val instanceof java.sql.Date) return ((java.sql.Date) val).toLocalDate();
        return null;
    }
}
