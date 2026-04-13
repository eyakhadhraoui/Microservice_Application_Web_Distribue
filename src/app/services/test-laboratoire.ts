import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface TestLaboratoire {
  idTestLaboratoire?: number;
  codeTest: string;
  codeLoinc?: string;
  nomTest: string;
  categorie?: string;
  typeEchantillon?: string;
  unite?: string;
  /** Déprécié : les normes sont dans NormePediatriqueLabo (âge, sexe). */
  valeursNormales?: string;
  methodeAnalyse?: string;
  prix?: number;
  /** Délai normal de rendu en heures (ex: 4, 24, 48). */
  delaiRenduHeures?: number;
  /** Important en pédiatrie. */
  necessiteJeune?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TestLaboratoireService {
  private apiUrl = '/api/tests-laboratoire';

  constructor(private http: HttpClient) {}

  create(dto: TestLaboratoire): Observable<TestLaboratoire> {
    return this.http.post<TestLaboratoire>(this.apiUrl, dto).pipe(
      catchError(err => {
        const msg = err?.error?.message ?? err?.message ?? 'Erreur lors de la création du test';
        return throwError(() => ({ message: msg, error: err?.error }));
      })
    );
  }

  getAll(): Observable<TestLaboratoire[]> {
    return this.http.get<TestLaboratoire[]>(this.apiUrl).pipe(
      catchError(err => throwError(() => err?.message || 'Erreur lors du chargement des tests'))
    );
  }

  getById(id: number): Observable<TestLaboratoire> {
    return this.http.get<TestLaboratoire>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => throwError(() => err?.message || 'Erreur'))
    );
  }
}
