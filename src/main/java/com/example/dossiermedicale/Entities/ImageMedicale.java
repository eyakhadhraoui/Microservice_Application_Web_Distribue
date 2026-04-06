package com.example.dossiermedicale.Entities;

import com.example.dossiermedicale.Enum.TypeImageMedicale;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "image_medicale")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor

public class ImageMedicale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idImage;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idDossierMedical", nullable = false)
    private DossierMedical dossierMedical;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 100)
    private TypeImageMedicale typeImage;

    @Column(nullable = false, length = 500)
    private String cheminImage;

    @Column(nullable = false)
    private LocalDate dateCapture;

    @Column(columnDefinition = "TEXT")
    private String description;
}