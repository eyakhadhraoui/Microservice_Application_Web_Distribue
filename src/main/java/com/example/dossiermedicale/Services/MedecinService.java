package com.example.dossiermedicale.Services;

import com.example.dossiermedicale.Entities.Medecin;
import com.example.dossiermedicale.Repository.MedecinRepository;
import com.example.dossiermedicale.dto.MedecinDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class MedecinService {

    private final MedecinRepository medecinRepository;

    /**
     * Retourne le médecin correspondant au username (Keycloak).
     * Si aucun médecin n'existe, en crée un avec nom = username, prenom = "".
     */
    public MedecinDTO findOrCreateByUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username médecin requis");
        }
        String trimmed = username.trim();
        // nom a une longueur max 120 en base
        String nom = trimmed.length() > 120 ? trimmed.substring(0, 120) : trimmed;
        return medecinRepository.findByUsername(trimmed)
                .map(this::toDTO)
                .orElseGet(() -> {
                    Medecin m = Medecin.builder()
                            .username(trimmed)
                            .nom(nom)
                            .prenom("")
                            .build();
                    Medecin saved = medecinRepository.save(m);
                    return toDTO(saved);
                });
    }

    private MedecinDTO toDTO(Medecin m) {
        MedecinDTO dto = new MedecinDTO();
        dto.setIdMedecin(m.getIdMedecin());
        dto.setUsername(m.getUsername() != null ? m.getUsername() : "");
        dto.setNom(m.getNom() != null ? m.getNom() : "");
        dto.setPrenom(m.getPrenom() != null ? m.getPrenom() : "");
        return dto;
    }
}
