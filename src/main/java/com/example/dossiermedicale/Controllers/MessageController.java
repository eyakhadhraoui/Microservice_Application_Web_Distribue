package com.example.dossiermedicale.Controllers;

import com.example.dossiermedicale.Services.MessageService;
import com.example.dossiermedicale.dto.MessageDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MessageController {

    private final MessageService messageService;

    @GetMapping("/dossier/{idDossierMedical}")
    public ResponseEntity<List<MessageDTO>> getByDossier(@PathVariable Long idDossierMedical) {
        return ResponseEntity.ok(messageService.getByDossier(idDossierMedical));
    }

    @PostMapping
    public ResponseEntity<MessageDTO> send(@Valid @RequestBody MessageDTO dto) {
        MessageDTO created = messageService.send(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}/lu")
    public ResponseEntity<Void> markAsLu(@PathVariable Long id) {
        messageService.markAsLu(id);
        return ResponseEntity.noContent().build();
    }
}
