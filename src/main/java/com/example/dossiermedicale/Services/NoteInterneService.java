package com.example.dossiermedicale.Services;

import com.example.dossiermedicale.Entities.DossierMedical;
import com.example.dossiermedicale.Entities.NoteInterne;
import com.example.dossiermedicale.Repository.DossierMedicalRepository;
import com.example.dossiermedicale.Repository.NoteInterneRepository;
import com.example.dossiermedicale.dto.NoteInterneDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class NoteInterneService {

    private final NoteInterneRepository noteInterneRepository;
    private final DossierMedicalRepository dossierMedicalRepository;

    private NoteInterneDTO toDTO(NoteInterne n) {
        NoteInterneDTO dto = new NoteInterneDTO();
        dto.setIdNoteInterne(n.getIdNoteInterne());
        dto.setIdDossierMedical(n.getDossierMedical().getIdDossierMedical());
        dto.setContenu(n.getContenu());
        dto.setDateCreation(n.getDateCreation());
        return dto;
    }

    public NoteInterneDTO create(NoteInterneDTO dto) {
        DossierMedical dossier = dossierMedicalRepository.findById(dto.getIdDossierMedical())
                .orElseThrow(() -> new RuntimeException("Dossier médical non trouvé: " + dto.getIdDossierMedical()));
        NoteInterne n = new NoteInterne();
        n.setDossierMedical(dossier);
        n.setContenu(dto.getContenu().trim());
        n.setDateCreation(java.time.LocalDateTime.now());
        return toDTO(noteInterneRepository.save(n));
    }

    @Transactional(readOnly = true)
    public List<NoteInterneDTO> getByDossier(Long idDossierMedical) {
        return noteInterneRepository.findByDossierMedicalIdDossierMedicalOrderByDateCreationDesc(idDossierMedical)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public void delete(Long id) {
        if (!noteInterneRepository.existsById(id)) {
            throw new RuntimeException("Note interne non trouvée: " + id);
        }
        noteInterneRepository.deleteById(id);
    }
}
