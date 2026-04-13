import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export type TypeExpediteur = 'MEDECIN' | 'PATIENT';

/** Message entre médecin et patient (questions, rappels). */
export interface Message {
  idMessage?: number;
  idDossierMedical: number;
  typeExpediteur: TypeExpediteur;
  contenu: string;
  dateEnvoi?: string;
  lu?: boolean;
  /** Affichage : nom de l'expéditeur (optionnel). */
  expediteurNom?: string;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
  private apiUrl = '/api/messages';

  constructor(private http: HttpClient) {}

  getByDossier(idDossierMedical: number): Observable<Message[]> {
    return this.http.get<any>(`${this.apiUrl}/dossier/${idDossierMedical}`).pipe(
      map(res => (Array.isArray(res) ? res : res?.content ?? res?.value ?? [])),
      catchError(() => of([]))
    );
  }

  send(dto: Message): Observable<Message> {
    return this.http.post<Message>(this.apiUrl, dto).pipe(
      catchError(err => {
        const msg = err?.status === 404 || err?.status === 500
          ? 'Service messagerie indisponible. Vérifiez que le backend expose POST /api/messages.'
          : (err?.error?.message ?? err?.message ?? 'Erreur envoi');
        return throwError(() => ({ message: msg }));
      })
    );
  }

  markAsLu(idMessage: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${idMessage}/lu`, {}).pipe(
      catchError(() => throwError(() => ({ message: 'Erreur' })))
    );
  }
}
