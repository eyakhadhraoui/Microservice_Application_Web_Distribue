import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Patient {
  idPatient: number;
  username: string;
  firstName?: string;
  lastName?: string;
}

@Injectable({ providedIn: 'root' })
export class PatientService {
  private apiUrl = '/api/patients';

  constructor(private http: HttpClient) {}

  /** Liste des patients (back office : créer dossier en choisissant un patient). */
  getAll(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.apiUrl);
  }
}
