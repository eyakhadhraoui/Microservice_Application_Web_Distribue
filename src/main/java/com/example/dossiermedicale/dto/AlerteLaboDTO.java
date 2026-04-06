package com.example.dossiermedicale.dto;

import com.example.dossiermedicale.Enum.TypeAlerteLabo;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlerteLaboDTO {
    private Long id;
    private Long resultatId;
    private TypeAlerteLabo typeAlerte;
    private String message;
    private Long acquitteePar;
    private LocalDateTime dateAcquittement;
    private String actionRealisee;
}
