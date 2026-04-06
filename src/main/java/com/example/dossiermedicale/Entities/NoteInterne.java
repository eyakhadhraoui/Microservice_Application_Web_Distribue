package com.example.dossiermedicale.Entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "note_interne")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NoteInterne {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idNoteInterne;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_dossier_medical", nullable = false)
    private DossierMedical dossierMedical;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenu;

    @Column(nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();
}
