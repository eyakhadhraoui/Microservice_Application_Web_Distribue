import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

export type TypeEventCalendrier = 'SUIVI' | 'IMAGE_MEDICALE';

export interface CalendrierEvent {
  date: string;
  type: TypeEventCalendrier;
  titre: string;
  id: number;
  idDossierMedical: number;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CalendrierService {
  private apiUrl = '/api/calendrier';

  constructor(private http: HttpClient) {}

  /** Événements du patient connecté (suivis + images médicales ajoutés par le médecin). Timeout 12 s. */
  getMesEvenements(): Observable<CalendrierEvent[]> {
    return this.http.get<CalendrierEvent[]>(`${this.apiUrl}/mes-evenements`).pipe(
      timeout(12000),
      map(list => Array.isArray(list) ? list.map(e => this.mapEvent(e)) : []),
      catchError((err) => {
        if (err?.name === 'TimeoutError' || err?.message?.includes('timeout')) {
          return throwError(() => new Error('Loading takes too long. Check your connection and try again.'));
        }
        const status = err?.status;
        const body = err?.error;
        const serverMsg = body && typeof body === 'object' && body.message ? body.message : null;
        if (status >= 500 && serverMsg) {
          return throwError(() => ({ ...err, message: serverMsg, error: body }));
        }
        if (status === 401 || status === 403) {
          return throwError(() => ({ ...err, message: 'Session expirée ou accès refusé.' }));
        }
        return of([]);
      })
    );
  }

  private mapEvent(dto: any): CalendrierEvent {
    return {
      date: dto.date ?? dto.dateSuivi ?? dto.dateCapture ?? '',
      type: dto.type ?? 'SUIVI',
      titre: dto.titre ?? dto.title ?? 'Événement',
      id: dto.id ?? 0,
      idDossierMedical: dto.idDossierMedical ?? 0,
      description: dto.description
    };
  }
}
