package org.example.hospitalisation.RestController;

import org.example.hospitalisation.Entities.DailyReport;
import org.example.hospitalisation.Services.IDailyReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/dailyReport")
public class DailyReportRestController {


    @Autowired
    IDailyReportService drs;


    //  http://localhost:8084/dailyReport/all
    @GetMapping("/all")
    public List<DailyReport> getAllDailyReports() {
        return drs.findAll();
    }



    //  http://localhost:8084/dailyReport/1

    @GetMapping("/{id}")
    public DailyReport getDailyReportById(@PathVariable Long id) {
        return drs.findDailyReportById(id);
    }



    // http://localhost:8084/dailyReport/add

    @PostMapping("/add")
    public DailyReport addDailyReport(@RequestBody DailyReport d) {
        return drs.addDailyReport(d);
    }


    // http://localhost:8084/dailyReport/update

    @PutMapping("/update")
    public DailyReport updateDailyReport(@RequestBody DailyReport d) {
        return drs.updateDailyReport(d);
    }


    // http://localhost:8084/dailyReport/delete/1

    @DeleteMapping("/delete/{id}")
    public void deleteDailyReport(@PathVariable Long id) {
        DailyReport d = drs.findDailyReportById(id);
        drs.deleteDailyReport(d);
    }

}
