import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

/** Statut du résultat : EN_ATTENTE / RECU / VALIDE */
export type StatutResultat = 'EN_ATTENTE' | 'RECU' | 'VALIDE';
/** Interprétation : NORMAL / ELEVE / BAS / CRITIQUE_HAUT / CRITIQUE_BAS */
export type InterpretationResultat = 'NORMAL' | 'ELEVE' | 'BAS' | 'CRITIQUE_HAUT' | 'CRITIQUE_BAS';
/** Source d'import : HL7 / PDF_OCR / SAISIE_MANUELLE / LABO_CONNECTE */
export type SourceImport = 'HL7' | 'PDF_OCR' | 'SAISIE_MANUELLE' | 'LABO_CONNECTE';

export interface ResultatLaboratoire {
  idResultatLaboratoire?: number;
  idDossierMedical: number;
  idTestLaboratoire: number;
  datePrelevement?: string;
  dateRendu?: string;
  dateResultat?: string;
  valeurNumerique?: number;
  valeurTexte?: string;
  /** Déprécié : préférer valeurNumerique + valeurTexte */
  valeurResultat?: string;
  unite?: string;
  conclusion?: string;
  statutResultat?: StatutResultat;
  interpretation?: InterpretationResultat;
  sourceImport?: SourceImport;
  valideParMedecin?: number;
  dateValidation?: string;
  partagePatient?: boolean;
  etat?: string;
  nomTest?: string;
  codeTest?: string;
}

/** Valeur affichable (numérique + unité ou texte ou ancienne valeur). */
export function formatValeurResultat(r: ResultatLaboratoire): string {
  if (!r) return '—';
  if (r.valeurNumerique != null) return r.valeurNumerique + (r.unite ? ' ' + r.unite : '');
  if (r.valeurTexte != null && r.valeurTexte !== '') return r.valeurTexte;
  return r.valeurResultat ?? '—';
}

@Injectable({ providedIn: 'root' })
export class ResultatLaboratoireService {
  private apiUrl = '/api/resultats-laboratoire';

  constructor(private http: HttpClient) {}

  create(dto: ResultatLaboratoire): Observable<ResultatLaboratoire> {
    return this.http.post<ResultatLaboratoire>(this.apiUrl, dto).pipe(
      catchError(err => {
        const msg = err?.error?.message ?? err?.message ?? 'Erreur création résultat';
        return throwError(() => ({ message: msg, error: err?.error }));
      })
    );
  }

  update(id: number, dto: ResultatLaboratoire): Observable<ResultatLaboratoire> {
    return this.http.put<ResultatLaboratoire>(`${this.apiUrl}/${id}`, dto).pipe(
      catchError(err => {
        const msg = err?.error?.message ?? err?.message ?? 'Erreur mise à jour';
        return throwError(() => ({ message: msg, error: err?.error }));
      })
    );
  }

  getByDossier(idDossierMedical: number): Observable<ResultatLaboratoire[]> {
    return this.http.get<ResultatLaboratoire[]>(`${this.apiUrl}/dossier/${idDossierMedical}`).pipe(
      catchError(err => throwError(() => ({ message: err?.error?.message ?? err?.message ?? 'Erreur chargement' })))
    );
  }

  getById(id: number): Observable<ResultatLaboratoire> {
    return this.http.get<ResultatLaboratoire>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => throwError(() => ({ message: err?.error?.message ?? err?.message ?? 'Erreur' })))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => throwError(() => ({ message: err?.error?.message ?? err?.message ?? 'Erreur suppression' })))
    );
  }

  getAll(): Observable<ResultatLaboratoire[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        const list = Array.isArray(response) ? response : (response?.content ?? response?.value ?? []);
        return Array.isArray(list) ? list : [];
      }),
      catchError(() => of([]))
    );
  }
}
