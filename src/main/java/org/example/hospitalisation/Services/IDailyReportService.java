package org.example.hospitalisation.Services;

import org.example.hospitalisation.Entities.DailyReport;

import java.time.LocalDateTime;
import java.util.List;

public interface IDailyReportService {
    List<DailyReport> findAll();
    //List<DailyReport> findByDate(LocalDateTime date);
    DailyReport addDailyReport(DailyReport d);
    DailyReport updateDailyReport(DailyReport d);
    void deleteDailyReport(DailyReport d);
    DailyReport findDailyReportById(Long id);

}
