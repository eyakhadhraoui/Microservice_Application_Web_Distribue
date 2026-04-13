import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Alerte {
  idDossierMedical: number;
  idPatient: number;
  idMedecin: number;
  dateDernierSuivi: string;
  joursSansSuivi: number;
  libelle: string;
}

@Injectable({ providedIn: 'root' })
export class AlerteService {
  private apiUrl = '/api/alertes';

  constructor(private http: HttpClient) {}

  getAlertes(jours?: number, idMedecin?: number): Observable<Alerte[]> {
    let params: string[] = [];
    if (jours != null && jours > 0) params.push(`jours=${jours}`);
    if (idMedecin != null) params.push(`idMedecin=${idMedecin}`);
    const qs = params.length ? '?' + params.join('&') : '';
    return this.http.get<Alerte[]>(`${this.apiUrl}${qs}`);
  }
}
