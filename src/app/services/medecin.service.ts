import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Medecin {
  idMedecin: number;
  username: string;
  nom: string;
  prenom: string;
}

@Injectable({
  providedIn: 'root'
})
export class MedecinService {
  private apiUrl = '/api/medecins';

  constructor(private http: HttpClient) {}

  /** Médecin connecté (JWT). Créé en base si besoin. */
  getMe(): Observable<Medecin> {
    return this.http.get<Medecin>(`${this.apiUrl}/me`);
  }
}
