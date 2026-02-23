package org.example.hospitalisation.Entities;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor

public class Hospitalization {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idHospitalization;
    private String reason;
    private LocalDateTime admissionDate;
    private LocalDateTime dischargeDate;
    private String room;
    private HospitalizationStatus status;
    @OneToMany(cascade = CascadeType.ALL, mappedBy="hospitalization")
    private Set<DailyReport> DailyReports;




}
