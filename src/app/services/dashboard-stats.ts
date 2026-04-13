import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DossierService } from './dossier';
import { SuiviService } from './suivi';
import { TestLaboratoireService } from './test-laboratoire';
import { ResultatLaboratoireService } from './resultat-laboratoire';
import { AlerteService } from './alerte';

export interface DashboardStats {
  dossiersMedicaux: number;
  suivis: number;
  typesTestsLabo: number;
  resultatsLabo: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardStatsService {
  constructor(
    private dossierService: DossierService,
    private suiviService: SuiviService,
    private testLaboratoireService: TestLaboratoireService,
    private resultatLaboratoireService: ResultatLaboratoireService
  ) {}

  getStats(): Observable<DashboardStats> {
    return forkJoin({
      dossiersMedicaux: this.dossierService.getAllDossiers().pipe(
        map(list => (Array.isArray(list) ? list : []).length),
        catchError(() => of(0))
      ),
      suivis: this.suiviService.getAllSuivis().pipe(
        map(list => (Array.isArray(list) ? list : []).length),
        catchError(() => of(0))
      ),
      typesTestsLabo: this.testLaboratoireService.getAll().pipe(
        map(list => (Array.isArray(list) ? list : []).length),
        catchError(() => of(0))
      ),
      resultatsLabo: this.resultatLaboratoireService.getAll().pipe(
        map(list => (Array.isArray(list) ? list : []).length),
        catchError(() => of(0))
      ),
    }).pipe(
      map(raw => ({
        dossiersMedicaux: raw.dossiersMedicaux,
        suivis: raw.suivis,
        typesTestsLabo: raw.typesTestsLabo,
        resultatsLabo: raw.resultatsLabo,
      }))
    );
  }
}
