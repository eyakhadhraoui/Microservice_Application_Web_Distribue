import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

/** Note interne du médecin sur un dossier (non visible par le patient). */
export interface NoteInterne {
  idNoteInterne?: number;
  idDossierMedical: number;
  contenu: string;
  dateCreation?: string;
  /** Affichage : nom du médecin (optionnel, venant du backend). */
  medecinNom?: string;
}

@Injectable({ providedIn: 'root' })
export class NotesInternesService {
  private apiUrl = '/api/notes-internes';

  constructor(private http: HttpClient) {}

  getByDossier(idDossierMedical: number): Observable<NoteInterne[]> {
    return this.http.get<any>(`${this.apiUrl}/dossier/${idDossierMedical}`).pipe(
      map(res => (Array.isArray(res) ? res : res?.content ?? res?.value ?? [])),
      catchError(() => of([]))
    );
  }

  create(dto: NoteInterne): Observable<NoteInterne> {
    return this.http.post<NoteInterne>(this.apiUrl, dto).pipe(
      catchError(err => {
        const msg = err?.status === 404 || err?.status === 500
          ? 'Service notes internes indisponible. Vérifiez que le backend expose POST /api/notes-internes.'
          : (err?.error?.message ?? err?.message ?? 'Erreur création');
        return throwError(() => ({ message: msg }));
      })
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => throwError(() => ({ message: err?.error?.message ?? err?.message ?? 'Erreur suppression' })))
    );
  }
}
