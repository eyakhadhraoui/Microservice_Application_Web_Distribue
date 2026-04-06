package com.example.dossiermedicale.Entities;

import com.example.dossiermedicale.Enum.TypeAlerteLabo;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Alerte déclenchée par un résultat critique (hyperkaliémie, DFG bas, etc.) ; acquittement par le médecin.
 */
@Entity
@Table(name = "alerte_labo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlerteLabo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "resultat_id", nullable = false)
    private Long resultatId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_alerte", nullable = false, length = 20)
    private TypeAlerteLabo typeAlerte;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "acquittee_par")
    private Long acquitteePar;

    @Column(name = "date_acquittement")
    private LocalDateTime dateAcquittement;

    @Column(name = "action_realisee", columnDefinition = "TEXT")
    private String actionRealisee;
}
