package org.example.hospitalisation.RestController;

import org.example.hospitalisation.Entities.Hospitalization;
import org.example.hospitalisation.Services.IHospitalizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/hospitalization")
public class HospitalizationRestController {
    @Autowired
    IHospitalizationService hs;


    // ✅ Get All
    //http://localhost:8084/hospitalization/all
    @GetMapping("/all")
    public List<Hospitalization> getAllHospitalizations() {
        return hs.findAll();
    }

    // ✅ Get By Id
    //http://localhost:8084/hospitalization/1
    @GetMapping("/{id}")
    public Hospitalization getHospitalizationById(@PathVariable Long id) {
        return hs.retrieveHospitalization(id);
    }

    // ✅ Add
    //http://localhost:8084/hospitalization/add
    @PostMapping("/add")
    public Hospitalization addHospitalization(@RequestBody Hospitalization h) {
        return hs.addHospitalization(h);
    }

    // ✅ Update
    //http://localhost:8084/hospitalization/update
    @PutMapping("/update")
    public Hospitalization updateHospitalization(@RequestBody Hospitalization h) {
        return hs.updateHospitalization(h);
    }


    // ✅ Delete
    //http://localhost:8084/hospitalization/delete/1

    @DeleteMapping("/delete")
    public void deleteHospitalization(@RequestBody Hospitalization h) {
        hs.deleteHospitalization(h);
    }
}
