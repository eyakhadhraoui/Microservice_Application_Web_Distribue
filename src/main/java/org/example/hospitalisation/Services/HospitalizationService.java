package org.example.hospitalisation.Services;

import org.example.hospitalisation.Entities.Hospitalization;
import org.example.hospitalisation.Repo.IHospitalizationRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HospitalizationService implements IHospitalizationService {

    @Autowired
    IHospitalizationRepo hr;


    @Override
    public List<Hospitalization> findAll() {
        return hr.findAll();
    }

    @Override
    public Hospitalization addHospitalization(Hospitalization h) {
        return hr.save(h);
    }

    @Override
    public Hospitalization updateHospitalization(Hospitalization h) {
        return hr.save(h);
    }

    @Override
    public void deleteHospitalization(Hospitalization h) {
        hr.delete(h);

    }

    @Override
    public Hospitalization retrieveHospitalization(Long idHospitalisation) {
        return hr.findById(idHospitalisation).get();
    }


}
