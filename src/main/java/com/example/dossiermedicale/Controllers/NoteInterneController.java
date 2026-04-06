package com.example.dossiermedicale.Controllers;

import com.example.dossiermedicale.Services.NoteInterneService;
import com.example.dossiermedicale.dto.NoteInterneDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes-internes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NoteInterneController {

    private final NoteInterneService noteInterneService;

    @GetMapping("/dossier/{idDossierMedical}")
    public ResponseEntity<List<NoteInterneDTO>> getByDossier(@PathVariable Long idDossierMedical) {
        return ResponseEntity.ok(noteInterneService.getByDossier(idDossierMedical));
    }

    @PostMapping
    public ResponseEntity<NoteInterneDTO> create(@Valid @RequestBody NoteInterneDTO dto) {
        NoteInterneDTO created = noteInterneService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        noteInterneService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
