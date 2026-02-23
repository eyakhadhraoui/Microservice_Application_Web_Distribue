package org.example.hospitalisation.Services;

import org.example.hospitalisation.Entities.DailyReport;
import org.example.hospitalisation.Repo.IDailyReportRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DailyReportService implements IDailyReportService {

    @Autowired
    IDailyReportRepo dr;

    @Override
    public List<DailyReport> findAll() {
        return  dr.findAll() ;
    }

//    @Override
//    public List<DailyReport> findByDate(LocalDateTime date) {
//        return List.of();
//    }

    @Override
    public DailyReport addDailyReport(DailyReport d) {
        return dr.save(d);
    }

    @Override
    public DailyReport updateDailyReport(DailyReport d) {
        return dr.save(d);
    }

    @Override
    public void deleteDailyReport(DailyReport d) {
        dr.delete(d);

    }

    @Override
    public DailyReport findDailyReportById(Long id) {
        return dr.findById(id).get();
    }
}
