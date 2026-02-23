package org.example.hospitalisation.Repo;

import org.example.hospitalisation.Entities.DailyReport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IDailyReportRepo extends JpaRepository<DailyReport,Long> {

}
