import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const BASE = environment.projetApiRoot;

/** Consultation (projetconsultation entity). */
export interface Consultation {
  idConsultation?: number;
  dateConsultation: string;
  diagnostic: string;
  notes?: string;
  idDossiermedical?: number;
  patient?: { idPatient: number };
  medecin?: { idMedecin: number; nom?: string; prenom?: string; username?: string };
  rapports?: unknown[];
  rendezvous?: Rendezvous;
}

/** Requête d'ajout (AddConsultationRequest). */
export interface AddConsultationRequest {
  dateConsultation: string;
  diagnostic: string;
  notes?: string;
  idDossiermedical?: number;
  idPatient: number;
  idMedecin: number;
  rendezvous?: { idRendezvous: number };
}

/** Rendezvous (projetconsultation). */
export interface Rendezvous {
  idRendezvous?: number;
  dateRendezvous?: string;
  etat?: string;
  idPatient?: number;
  idConsultation?: number;
  patient?: unknown;
  consultation?: unknown;
}

export interface RendezvousDTO {
  idRendezvous?: number;
  dateRendezvous: string;
  etat: string;
  idPatient?: number;
  idConsultation?: number;
}

/** Rapport (projetconsultation). */
export interface Rapport {
  idRapport?: number;
  dateRapport?: string;
  contenu?: string;
  recommendations?: string;
  idConsultation?: number;
  /** Sérialisation JPA : lien vers la consultation. */
  consultation?: { idConsultation?: number };
}

export interface RapportDTO {
  idRapport?: number;
  dateRapport: string;
  contenu: string;
  recommendations?: string;
  idConsultation: number;
}

/** Patient (PatientDTO). */
export interface PatientDTO {
  idPatient: number;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  telephone?: string;
  dateNaissance?: string;
}

@Injectable({ providedIn: 'root' })
export class ConsultationService {
  constructor(private http: HttpClient) {}

  // ─── Consultations ────────────────────────────────────────────────────────

  /** Consultations du médecin connecté (JWT). Même principe que MedecinService.getMe(). */
  getMe(): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${BASE}/consultation/me`).pipe(
      catchError(() => of([]))
    );
  }

  getConsultations(): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${BASE}/consultation/retrieveConsultations`).pipe(
      catchError(() => of([]))
    );
  }

  getConsultation(id: number): Observable<Consultation> {
    return this.http.get<Consultation>(`${BASE}/consultation/retrieveConsultation/${id}`);
  }

  addConsultation(req: AddConsultationRequest): Observable<Consultation> {
    return this.http.post<Consultation>(`${BASE}/consultation/addConsultation`, req);
  }

  updateConsultation(id: number, consultation: Consultation): Observable<Consultation> {
    return this.http.put<Consultation>(`${BASE}/consultation/updateConsultation/${id}`, { ...consultation, idConsultation: id });
  }

  removeConsultation(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/consultation/removeConsultation/${id}`);
  }

  // ─── Rendezvous ───────────────────────────────────────────────────────────

  getRendezvous(): Observable<Rendezvous[]> {
    return this.http.get<Rendezvous[]>(`${BASE}/rendezvous/retrieveRendezvous`).pipe(
      catchError(() => of([]))
    );
  }

  getRendezvousById(id: number): Observable<Rendezvous> {
    return this.http.get<Rendezvous>(`${BASE}/rendezvous/retrieveRendezvous/${id}`);
  }

  getDisponibles(): Observable<Rendezvous[]> {
    return this.http.get<Rendezvous[]>(`${BASE}/rendezvous/disponibles`).pipe(
      catchError(() => of([]))
    );
  }

  addRendezvous(dto: RendezvousDTO): Observable<Rendezvous> {
    return this.http.post<Rendezvous>(`${BASE}/rendezvous/addRendezvous`, dto);
  }

  updateRendezvous(dto: RendezvousDTO): Observable<Rendezvous> {
    return this.http.put<Rendezvous>(`${BASE}/rendezvous/updateRendezvous`, dto);
  }

  removeRendezvous(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/rendezvous/removeRendezvous/${id}`);
  }

  // ─── Rapports ─────────────────────────────────────────────────────────────

  getRapports(): Observable<Rapport[]> {
    return this.http.get<Rapport[]>(`${BASE}/rapport/retrieveRapports`).pipe(
      catchError(() => of([]))
    );
  }

  getRapport(id: number): Observable<Rapport> {
    return this.http.get<Rapport>(`${BASE}/rapport/retrieveRapport/${id}`);
  }

  addRapport(dto: RapportDTO): Observable<Rapport> {
    return this.http.post<Rapport>(`${BASE}/rapport/addRapport`, dto);
  }

  updateRapport(dto: RapportDTO): Observable<Rapport> {
    return this.http.put<Rapport>(`${BASE}/rapport/updateRapport`, dto);
  }

  removeRapport(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/rapport/removeRapport/${id}`);
  }

  // ─── Patients ─────────────────────────────────────────────────────────────

  getPatients(): Observable<PatientDTO[]> {
    return this.http.get<PatientDTO[]>(`${BASE}/patient/retrievePatients`).pipe(
      catchError(() => of([]))
    );
  }
}
