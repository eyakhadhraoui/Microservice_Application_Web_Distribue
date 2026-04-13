import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ResultatLaboratoireService, ResultatLaboratoire } from './resultat-laboratoire';

const STORAGE_KEY_LAST_VISIT = 'dashboard_last_visit';

/** Service partagé pour afficher le nombre de nouveaux tests (badge cloche navbar, bannière dashboard). */
@Injectable({ providedIn: 'root' })
export class DashboardNotificationService {
  private countSubject = new BehaviorSubject<number>(0);
  private isFirstVisitSubject = new BehaviorSubject<boolean>(false);

  newTestsCount$ = this.countSubject.asObservable();
  isFirstVisit$ = this.isFirstVisitSubject.asObservable();

  constructor(private resultatLaboratoireService: ResultatLaboratoireService) {}

  setNewTestsCount(count: number): void {
    this.countSubject.next(count);
  }

  get newTestsCount(): number {
    return this.countSubject.value;
  }

  get isFirstVisit(): boolean {
    return this.isFirstVisitSubject.value;
  }

  /** Charge le nombre de nouveaux tests et met à jour la « dernière visite ». À appeler à l'entrée du back office (Layout). */
  load(): void {
    const lastVisitRaw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_LAST_VISIT) : null;
    const lastVisit = lastVisitRaw ? new Date(lastVisitRaw).getTime() : null;

    this.resultatLaboratoireService.getAll().subscribe({
      next: (list) => {
        const resultats = Array.isArray(list) ? list : [];
        let count: number;
        let firstVisit: boolean;
        if (lastVisit == null) {
          firstVisit = true;
          count = resultats.length;
        } else {
          firstVisit = false;
          count = resultats.filter((r: ResultatLaboratoire) => {
            const dateStr = (r as any).dateResultat ?? (r as any).date_resultat;
            if (!dateStr) return false;
            const t = new Date(dateStr).getTime();
            return !Number.isNaN(t) && t > lastVisit;
          }).length;
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_LAST_VISIT, new Date().toISOString());
        }
        this.countSubject.next(count);
        this.isFirstVisitSubject.next(firstVisit);
      },
      error: () => {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_LAST_VISIT, new Date().toISOString());
        }
        this.countSubject.next(0);
        this.isFirstVisitSubject.next(false);
      },
    });
  }
}
