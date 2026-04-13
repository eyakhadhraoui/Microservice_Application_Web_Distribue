import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

export interface Suivi {
  idSuivi?: number;
  dateSuivi: string;
  notes?: string;
  objectif?: string;
  resultat?: string;
}

export interface DossierMedical {
  idDossierMedical?: number;
  idPatient: number;
  dateCreation: string;
  idMedecin: number;
  diagnostic: string;
  notes?: string;
  /** Poids (kg) — ex-ParametreVital. */
  poids?: number;
  /** Taille (cm) — ex-ParametreVital. */
  taille?: number;
  /** IMC — ex-ParametreVital. */
  imc?: number;
  suivis?: Suivi[];
  patientNom?: string;
  medecinNom?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DossierService {
  /** URL relative : proxy → API Gateway (8095), sauf /api/auth → Symfony user-service (8000). */
  private apiUrl = '/api/dossiers-medicaux';

  constructor(private http: HttpClient) {}

  /** Dossiers d’un patient (Dossiers du patient connecté (JWT → /mes-dossiers). */
  getMesDossiers(): Observable<DossierMedical[]> {
    return this.http.get<any>(`${this.apiUrl}/mes-dossiers`).pipe(
      map(response => {
        const list = Array.isArray(response) ? response : (response?.content ?? response?.value ?? []);
        return (Array.isArray(list) ? list : []).map((d: any) => this.mapToFrontend(d));
      }),
      catchError(this.handleError)
    );
  }

  getDossiersByPatient(idPatient: number): Observable<DossierMedical[]> {
    return this.http.get<any>(`${this.apiUrl}/patient/${idPatient}`).pipe(
      map(response => {
        const list = Array.isArray(response) ? response : (response?.content ?? response?.value ?? []);
        return (Array.isArray(list) ? list : []).map((d: any) => this.mapToFrontend(d));
      }),
      catchError(this.handleError)
    );
  }

  getAllDossiers(): Observable<DossierMedical[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      tap(response => {
        console.log('📥 Réponse brute du backend:', response);
        console.log('📥 Type de la réponse:', typeof response);
        console.log('📥 Est un array?:', Array.isArray(response));
        if (response && typeof response === 'object') {
          console.log('📥 Clés de la réponse:', Object.keys(response));
        }
      }),
      map(response => {
        // Gérer les différents formats de réponse
        let dossiers = response;
        
        // Format .NET: { "value": [...], "Count": n }
        if (response && response.value && Array.isArray(response.value)) {
          dossiers = response.value;
          console.log('✅ Format detecté: .NET (objet.value)');
        }
        // Format Spring Data REST: { "content": [...] }
        else if (response && response.content && Array.isArray(response.content)) {
          dossiers = response.content;
          console.log('✅ Format detecté: Spring Data (objet.content)');
        }
        // Format HAL+JSON: { "_embedded": {...} }
        else if (response && response._embedded && response._embedded.dossierMedicals) {
          dossiers = response._embedded.dossierMedicals;
          console.log('✅ Format detecté: HAL+JSON');
        }
        // Si c'est déjà un array
        else if (Array.isArray(response)) {
          dossiers = response;
          console.log('✅ Format detecté: Array simple');
        }
        // Si c'est un objet mais pas un array reconnu
        else if (response && typeof response === 'object' && !Array.isArray(response)) {
          console.warn('⚠️ Format inconnu. Clés disponibles:', Object.keys(response));
          dossiers = [];
        }
        
        // S'assurer que c'est un array
        if (!Array.isArray(dossiers)) {
          console.warn('⚠️ La réponse n\'est pas un array, conversion en array vide');
          dossiers = [];
        }
        
        console.log('🔢 Nombre de dossiers:', dossiers.length);
        
        // Mapper chaque dossier
        return dossiers.map((d: any) => this.mapToFrontend(d));
      }),
      tap(data => {
        console.log('✅ Dossiers finalement mappés:', data);
        console.log('✅ Nombre final:', data.length);
      }),
      catchError(this.handleError)
    );
  }

  createDossier(dossier: DossierMedical): Observable<DossierMedical> {
    const dto = this.mapToBackend(dossier);
    console.log('📤 Envoi:', dto);
    
    return this.http.post<any>(this.apiUrl, dto, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(
      map(d => this.mapToFrontend(d)),
      tap(data => console.log('✅ Créé:', data)),
      catchError(this.handleError)
    );
  }

  updateDossier(id: number, dossier: DossierMedical): Observable<DossierMedical> {
    const dto = this.mapToBackend(dossier);
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(
      map(d => this.mapToFrontend(d)),
      catchError(this.handleError)
    );
  }

  deleteDossier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private mapToFrontend(dto: any): DossierMedical {
    if (!dto) {
      console.warn('⚠️ DTO est null/undefined');
      return {
        idPatient: 0,
        dateCreation: new Date().toISOString().split('T')[0],
        idMedecin: 0,
        diagnostic: 'AUTRE',
        notes: ''
      };
    }

    console.log('🔄 DTO original reçu:', dto);
    const keys = Object.keys(dto || {});
    console.log('🔍 Clés du DTO:', keys);

    // Supporter plusieurs conventions de nommage (camelCase et snake_case)
    const idDossierMedical = dto.idDossierMedical ?? dto.id_dossier_medical ?? dto.id_dossierMedical ?? dto.idDossier_medical;
    const idPatient = dto.idPatient ?? dto.id_patient ?? dto.patientId ?? 0;
    const dateCreation = dto.dateCreation ?? dto.date_creation ?? dto.createdAt ?? '';
    const idMedecin = dto.idMedecin ?? dto.id_medecin ?? dto.medecinId ?? 0;
    const diagnostic = dto.diagnostic ?? dto.diagnosticType ?? dto.type ?? 'AUTRE';
    const notes = dto.notes ?? dto.note ?? dto.description ?? '';
    const suivis = dto.suivis ?? dto.suivi ?? dto.followups ?? [];
    const patientNom = dto.patientNom ?? dto.patient_nom;
    const medecinNom = dto.medecinNom ?? dto.medecin_nom;
    const poids = dto.poids ?? dto.poids_kg;
    const taille = dto.taille ?? dto.taille_cm;
    const imc = dto.imc;

    const mapped: DossierMedical = {
      idDossierMedical,
      idPatient,
      dateCreation: dateCreation || new Date().toISOString().split('T')[0],
      idMedecin,
      diagnostic,
      notes,
      poids: poids != null ? Number(poids) : undefined,
      taille: taille != null ? Number(taille) : undefined,
      imc: imc != null ? Number(imc) : undefined,
      suivis,
      patientNom,
      medecinNom
    };

    console.log('✅ Après mapping:', mapped);

    return mapped;
  }

  private mapToBackend(dossier: DossierMedical): any {
    console.log('🔄 Mapping vers backend:', dossier);
    
    // S'assurer que les valeurs numériques sont bien des nombres
    const idPatient = typeof dossier.idPatient === 'string' ? parseInt(dossier.idPatient, 10) : dossier.idPatient;
    const idMedecin = typeof dossier.idMedecin === 'string' ? parseInt(dossier.idMedecin, 10) : dossier.idMedecin;
    
    // S'assurer que le diagnostic est valide (non vide)
    const diagnostic = dossier.diagnostic && dossier.diagnostic.trim() !== '' 
      ? dossier.diagnostic 
      : 'AUTRE';
    
    // Payload camelCase (Spring Boot par défaut accepte camelCase)
    const dto: Record<string, unknown> = {
      idPatient: idPatient,
      idMedecin: idMedecin,
      dateCreation: dossier.dateCreation || new Date().toISOString().split('T')[0],
      diagnostic: diagnostic,
      notes: dossier.notes ?? '',
      ...(dossier.poids != null && { poids: Number(dossier.poids) }),
      ...(dossier.taille != null && { taille: Number(dossier.taille) }),
      ...(dossier.imc != null && { imc: Number(dossier.imc) })
    };
    
    // Ne pas envoyer id à la création
    if (dossier.idDossierMedical != null && dossier.idDossierMedical > 0) {
      dto['idDossierMedical'] = dossier.idDossierMedical;
    }
    
    console.log('📤 DTO envoyé au backend:', JSON.stringify(dto, null, 2));
    console.log('📤 Types:', {
      idPatient: typeof dto['idPatient'],
      idMedecin: typeof dto['idMedecin'],
      dateCreation: typeof dto['dateCreation'],
      diagnostic: typeof dto['diagnostic'],
      diagnosticValue: dto['diagnostic']
    });
    
    return dto;
  }

  private handleError(error: HttpErrorResponse) {
    console.error('❌ Erreur complète:', error);
    console.error('❌ Status:', error.status);
    console.error('❌ Error body:', error.error);
    console.error('❌ Error body (stringified):', JSON.stringify(error.error, null, 2));
    
    let msg = 'Erreur serveur';
    
    if (error.status === 0) {
      msg = 'Impossible de contacter le serveur backend';
    } else if (error.status === 401) {
      const e = error.error;
      if (e && typeof e === 'object' && typeof (e as { message?: string }).message === 'string') {
        msg = (e as { message: string }).message;
      } else if (typeof e === 'string' && e.trim()) {
        msg = e;
      } else {
        msg =
          'Non authentifié ou session expirée. Connectez-vous à nouveau (le jeton est requis par la passerelle).';
      }
    } else if (error.status === 403) {
      const e = error.error;
      if (e && typeof e === 'object' && typeof (e as { message?: string }).message === 'string') {
        msg = (e as { message: string }).message;
      } else if (typeof e === 'string' && e.trim()) {
        msg = e;
      } else {
        msg = 'Accès refusé pour cette action.';
      }
    } else if (error.status === 400) {
      // Erreur de validation (GlobalExceptionHandler ou Spring)
      const e = error.error;
      if (e && typeof e === 'object') {
        // Format GlobalExceptionHandler: errors[] avec field, message, rejectedValue
        if (Array.isArray(e.errors)) {
          msg = e.errors.map((err: any) => {
            const field = err.field || err.property || '';
            const message = err.message || err.defaultMessage || String(err.rejectedValue ?? '');
            return field ? `${field}: ${message}` : message;
          }).join(' ; ') || (e.message || 'Erreur de validation');
        }
        // Format avec message détaillé
        else if (e.message) {
          msg = e.message;
        }
        // Format avec error
        else if (e.error) {
          msg = typeof e.error === 'string' ? e.error : JSON.stringify(e.error);
        }
        // Format avec timestamp (erreur Spring Boot standard)
        else {
          msg = `Erreur de validation: ${JSON.stringify(e)}`;
        }
      } else if (typeof e === 'string') {
        msg = e;
      } else {
        msg = 'Erreur de validation - vérifiez que tous les champs sont correctement remplis';
      }
    } else if (error.error) {
      const e = error.error;
      if (typeof e === 'string') {
        msg = e;
      } else if (e.message) {
        msg = e.message;
      } else if (e.detail) {
        msg = typeof e.detail === 'string' ? e.detail : JSON.stringify(e.detail);
      } else if (Array.isArray(e.errors)) {
        msg = e.errors.map((err: any) => err?.defaultMessage || err?.message || err).join(' ; ');
      } else if (e.errors && typeof e.errors === 'object') {
        msg = Object.entries(e.errors).map(([k, v]) => `${k}: ${v}`).join(' ; ');
      } else if (e.error && typeof e.error === 'string') {
        msg = e.error;
      } else {
        msg = e.message || e.error || error.statusText || JSON.stringify(e);
      }
    }
    
    console.error('📭 Message final:', msg);
    return throwError(() => new Error(msg));
  }
}