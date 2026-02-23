package com.example.NEPHRO.Entities;

import com.example.NEPHRO.Enum.Diagnostic;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "dossier_medical")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"suivis"})
@EqualsAndHashCode(exclude = {"suivis"})
public class DossierMedical {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idDossierMedical;



    @Column(nullable = false)
    private LocalDate dateCreation;



    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 100)
    private Diagnostic diagnostic;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "patient_id")
    private Long idPatient;

    @Column(name = "medecin_id")
    private Long idMedecin;

    @OneToMany(mappedBy = "dossierMedical", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Suivi> suivis = new ArrayList<>();


}