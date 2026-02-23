package org.example.hospitalisation.Services;

import org.example.hospitalisation.Entities.Hospitalization;

import java.util.List;

public interface IHospitalizationService {

    List<Hospitalization> findAll();
    //List<Hospitalization> findByreason(String reason);
    Hospitalization addHospitalization(Hospitalization h);
    Hospitalization updateHospitalization(Hospitalization h);
    void deleteHospitalization(Hospitalization h);
    Hospitalization retrieveHospitalization(Long idHospitalisation);

}
