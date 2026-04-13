import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { of } from 'rxjs';

export interface Suivi {
  idSuivi?: number;
  idDossierMedical?: number;
  dateSuivi: string;
  notes?: string;
  objectif?: string;
  resultat?: string;
  statut?: string;
  /** Pièce jointe (PDF ou image) : chemin retourné par upload. */
  cheminPieceJointe?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SuiviService {
  /** URL ABSOLUE : on appelle directement le backend Spring Boot. */
  private apiUrl = '/suivis';

  constructor(private http: HttpClient) {}

  /** Récupère tous les suivis (pour statistiques dashboard). */
  getAllSuivis(): Observable<Suivi[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        const list = Array.isArray(response) ? response : (response?.content ?? response?.data ?? []);
        return (Array.isArray(list) ? list : []).map((s: any) => this.mapToFrontend(s));
      }),
      catchError(() => of([]))
    );
  }

  /** Upload d'une pièce jointe (PDF ou image) pour un suivi. Retourne le chemin à passer dans suivi.cheminPieceJointe. */
  uploadPieceJointe(file: File): Observable<{ path: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ path: string }>(`${this.apiUrl}/upload`, formData).pipe(
      catchError(this.handleError)
    );
  }

  /** OCR : extrait le texte d'une image ou d'un PDF (scan de suivi). Retourne { text, error? }. */
  ocrExtractText(file: File): Observable<{ text: string; error?: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ text: string; error?: string }>(`${this.apiUrl}/ocr`, formData).pipe(
      catchError(this.handleError)
    );
  }

  createSuivi(idDossierMedical: number, suivi: Suivi): Observable<Suivi> {
    const dto = this.mapToBackend(suivi, idDossierMedical);
    const url = `${this.apiUrl}`;
    return this.http.post<any>(url, dto, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(
      map(s => this.mapToFrontend(s)),
      tap(data => console.log('✅ Suivi créé:', data)),
      catchError(this.handleError)
    );
  }

  deleteSuivi(idSuivi: number): Observable<void> {
    const url = `${this.apiUrl}/${idSuivi}`;
    return this.http.delete<void>(url).pipe(catchError(this.handleError));
  }

  getSuivisByDossier(idDossierMedical: number): Observable<Suivi[]> {
    const url = `${this.apiUrl}/dossier/${idDossierMedical}`;
    
    console.log('═══════════════════════════════════════');
    console.log('🔗 Appel API Suivis');
    console.log('   Dossier ID:', idDossierMedical);
    console.log('   URL relative:', url);
    console.log('   URL complète attendue:', `http://localhost:4200${url}`);
    console.log('   Passerelle (proxy → 8095):', `http://localhost:4200${url}`);
    console.log('═══════════════════════════════════════');
    
    return this.http.get<any>(url, { 
      headers: { 'Accept': 'application/json' },
      responseType: 'json' 
    }).pipe(
      tap(response => {
        // Vérifier si la réponse est du HTML (erreur de proxy)
        if (typeof response === 'string' && response.includes('<!DOCTYPE html>')) {
          console.error('❌ Le proxy retourne du HTML au lieu de JSON. Vérifiez l’API Gateway (8095) et les microservices.');
          throw new Error('Réponse HTML reçue - backend non accessible');
        }
        console.log('═══════════════════════════════════════');
        console.log('✅ RÉPONSE API BRUTE:');
        console.log('   Type:', typeof response);
        console.log('   Est Array?', Array.isArray(response));
        console.log('   Contenu:', JSON.stringify(response, null, 2));
        console.log('═══════════════════════════════════════');
      }),
      map(response => {
        // Gérer différents formats de réponse possibles
        let suivis: any[] = [];
        
        // Cas 1: Réponse directe en tableau
        if (Array.isArray(response)) {
          suivis = response;
          console.log('✅ Format: Tableau direct');
        }
        // Cas 2: Réponse avec propriété 'suivis'
        else if (response && response.suivis && Array.isArray(response.suivis)) {
          suivis = response.suivis;
          console.log('✅ Format: Objet avec propriété "suivis"');
        }
        // Cas 3: Réponse avec propriété 'data'
        else if (response && response.data && Array.isArray(response.data)) {
          suivis = response.data;
          console.log('✅ Format: Objet avec propriété "data"');
        }
        // Cas 4: Objet unique (transformer en tableau)
        else if (response && typeof response === 'object') {
          suivis = [response];
          console.log('✅ Format: Objet unique converti en tableau');
        }
        
        // Mapper chaque suivi vers le format frontend
        const mappedSuivis = suivis.map(s => this.mapToFrontend(s));
        
        console.log('═══════════════════════════════════════');
        console.log('✅ SUIVIS MAPPÉS:');
        console.log('   Nombre:', mappedSuivis.length);
        if (mappedSuivis.length > 0) {
          console.log('   Premier suivi:', mappedSuivis[0]);
        }
        console.log('═══════════════════════════════════════');
        
        return mappedSuivis;
      }),
      catchError(error => {
        console.error('═══════════════════════════════════════');
        console.error('❌ ERREUR lors du chargement des suivis');
        console.error('   URL relative:', url);
        console.error('   URL complète:', error.url || `http://localhost:4200${url}`);
        console.error('   Status:', error.status);
        console.error('   StatusText:', error.statusText);
        console.error('   Message:', error.message);
        
        // Vérifier si c'est une erreur HTML (backend non accessible)
        const isHtmlError = error.error && (
          (typeof error.error === 'string' && error.error.includes('<!DOCTYPE')) ||
          (error.error && typeof error.error === 'object' && error.error.toString().includes('<!DOCTYPE'))
        );
        
        if (isHtmlError) {
          console.error('   ⚠️ Le backend retourne du HTML au lieu de JSON.');
          console.error('   📋 INSTRUCTIONS:');
          console.error('      1. Vérifiez que le backend Spring Boot est démarré');
          console.error('      2. L’API Gateway doit être sur http://localhost:8095 (proxy ng serve)');
          console.error('      3. Redémarrez le serveur Angular (ng serve)');
          console.error('      4. Vérifiez les logs du proxy dans le terminal ng serve');
        } else if (error.status === 404) {
          console.error('   ⚠️ Erreur 404 - Endpoint non trouvé');
          console.error('   📋 VÉRIFICATIONS:');
          console.error('      1. L’API Gateway (8095) et dossiermedicale (8089) sont-ils démarrés?');
          console.error('      2. L\'endpoint /suivis/dossier/{id} existe-t-il dans SuiviController?');
          console.error('      3. Le proxy (proxy.conf.json) est-il correctement configuré?');
          console.error('      4. Redémarrez ng serve après modification du proxy.conf.json');
        } else if (error.status === 0) {
          console.error('   ⚠️ Erreur de connexion (CORS ou backend inaccessible)');
          console.error('   📋 VÉRIFICATIONS:');
          console.error('      1. Le backend Spring Boot est-il démarré?');
          console.error('      2. Le proxy Angular est-il actif?');
        }
        
        console.error('═══════════════════════════════════════');
        
        // Ne pas réessayer si c'est une erreur de parsing HTML
        if (isHtmlError) {
          return throwError(() => new Error('Le backend n\'est pas accessible. Vérifiez qu\'il est démarré sur le port 8089 et que le proxy fonctionne.'));
        }
        
        // Pour les erreurs 404, retourner un tableau vide plutôt que de planter
        if (error.status === 404) {
          console.warn('⚠️ Retour d\'un tableau vide pour l\'erreur 404');
          return [];
        }
        
        return this.handleError(error);
      })
    );
  }


  private mapToFrontend(dto: any): Suivi {
    if (!dto) {
      return {
        dateSuivi: new Date().toISOString().split('T')[0],
        notes: '',
        objectif: '',
        resultat: ''
      };
    }

    console.log('🔄 Suivi DTO reçu:', dto);
    
    return {
      idSuivi: dto.idSuivi ?? dto.id_suivi ?? undefined,
      idDossierMedical: dto.idDossierMedical ?? dto.id_dossier_medical ?? undefined,
      dateSuivi: dto.dateSuivi ?? dto.date_suivi ?? new Date().toISOString().split('T')[0],
      notes: dto.notes ?? dto.note ?? '',
      objectif: dto.objectif ?? dto.objective ?? '',
      resultat: dto.resultat ?? dto.result ?? '',
      statut: dto.statut ?? dto.status ?? '',
      cheminPieceJointe: dto.cheminPieceJointe ?? dto.chemin_piece_jointe ?? undefined
    };
  }

  private mapToBackend(suivi: Suivi, idDossierMedical?: number): any {
    const dto: Record<string, unknown> = {
      idDossierMedical: idDossierMedical,
      dateSuivi: suivi.dateSuivi,
      notes: suivi.notes || '',
      objectif: suivi.objectif || '',
      resultat: suivi.resultat || '',
      statut: suivi.statut || 'EN_COURS'
    };
    if (suivi['cheminPieceJointe']) dto['cheminPieceJointe'] = suivi['cheminPieceJointe'];
    return dto;
  }

  private handleError(error: HttpErrorResponse) {
    console.error('❌ Erreur complète:', error);
    console.error('❌ Status:', error.status);
    console.error('❌ Error body:', error.error);
    
    let msg = 'Erreur serveur';
    
    if (error.status === 0) {
      msg = 'Impossible de contacter le serveur backend';
    } else if (error.error) {
      // If error.error is a string
      if (typeof error.error === 'string') {
        msg = error.error;
      } 
      // If error.error is an object with message
      else if (error.error.message) {
        msg = error.error.message;
      }
      // If error.error is an object with error array (validation errors)
      else if (error.error.error) {
        msg = error.error.error;
      }
      // If error has statusText
      else if (error.statusText) {
        msg = `${error.status}: ${error.statusText}`;
      }
      // Last resort - try to get any useful info
      else {
        msg = JSON.stringify(error.error);
      }
    }
    
    console.error('📭 Message final:', msg);
    return throwError(() => new Error(msg));
  }
}