package com.example.NEPHRO.Entities;

import com.example.NEPHRO.Enum.TypeImageMedicale;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "image_medicale")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "suivi")
@EqualsAndHashCode(exclude = "suivi")
public class ImageMedicale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idImage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idSuivi", nullable = false)
    private Suivi suivi;

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