package com.example.dossiermedicale.Entities;

import com.example.dossiermedicale.Enum.TypeExpediteur;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "message")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idMessage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_dossier_medical", nullable = false)
    private DossierMedical dossierMedical;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TypeExpediteur typeExpediteur;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenu;

    @Column(nullable = false)
    private LocalDateTime dateEnvoi = LocalDateTime.now();

    @Column(nullable = false)
    private Boolean lu = false;
}
