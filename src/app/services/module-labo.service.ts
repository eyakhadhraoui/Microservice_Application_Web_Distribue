import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/** Statut prescription : EN_ATTENTE | PARTIEL | COMPLET | ANNULE */
export type StatutPrescription = 'EN_ATTENTE' | 'PARTIEL' | 'COMPLET' | 'ANNULE';
/** Source résultat : LABO_EXTERNE | HL7 | PDF_OCR | SAISIE_MANUELLE */
export type SourceResultat = 'LABO_EXTERNE' | 'HL7' | 'PDF_OCR' | 'SAISIE_MANUELLE';
/** Interprétation : NORMAL | ELEVE | BAS | CRITIQUE_HAUT | CRITIQUE_BAS */
export type StatutInterpretation = 'NORMAL' | 'ELEVE' | 'BAS' | 'CRITIQUE_HAUT' | 'CRITIQUE_BAS';
export type SexeNorme = 'M' | 'F' | 'TOUS';
export type TypeAlerteLabo = 'CRITIQUE' | 'AVERTISSEMENT' | 'INFO';

export interface PrescriptionBilanDTO {
  id?: number;
  dossierId: number;
  medecinId: number;
  datePrescription: string;
  typeBilan?: string;
  examens: string[];
  urgence?: boolean;
  laboId?: number;
  statut?: StatutPrescription;
  noteClinique?: string;
}

export interface ResultatLabtestDTO {
  id?: number;
  /** Optionnel : null si résultat sans prescription (bilan externe, import manuel, urgences). */
  prescriptionId?: number | null;
  dossierId: number;
  codeLoinc: string;
  libelleExamen?: string;
  valeur?: number;
  unite?: string;
  datePrelevement?: string;
  dateRendu?: string;
  source?: SourceResultat;
  statutInterpretation?: StatutInterpretation;
  valideParMedecin?: number;
}

export interface RapportBilanDTO {
  id?: number;
  dossierId: number;
  periodeDebut: string;
  periodeFin: string;
  resultatsIds: number[];
  commentaireMedecin?: string;
  pdfUrl?: string;
  partageFamille: boolean;
  dateGeneration?: string;
  generePar: number;
}

export interface AlerteLaboDTO {
  id: number;
  resultatId: number;
  typeAlerte: TypeAlerteLabo;
  message: string;
  acquitteePar?: number;
  dateAcquittement?: string;
  actionRealisee?: string;
}

/**
 * Service front pour le module 4 : Prescription → Résultats labo → Interprétation → Validation → Rapport → Famille.
 * Backend dossiermedicale via Gateway (proxy → 8095) : /api/prescriptions-bilan, /api/resultats-labtest, etc.
 */
@Injectable({ providedIn: 'root' })
export class ModuleLaboService {
  private base = '/api';

  constructor(private http: HttpClient) {}

  // ——— Prescriptions ———
  createPrescription(dto: PrescriptionBilanDTO): Observable<PrescriptionBilanDTO> {
    return this.http.post<PrescriptionBilanDTO>(`${this.base}/prescriptions-bilan`, dto).pipe(
      catchError(e => throwError(() => ({ message: e?.error?.message ?? e?.message ?? 'Erreur création prescription' })))
    );
  }

  getPrescriptionsByDossier(dossierId: number): Observable<PrescriptionBilanDTO[]> {
    return this.http.get<PrescriptionBilanDTO[]>(`${this.base}/prescriptions-bilan/dossier/${dossierId}`).pipe(
      catchError(e => throwError(() => ({ message: e?.error?.message ?? e?.message ?? 'Erreur chargement' })))
    );
  }

  getPrescriptionsByMedecin(medecinId: number): Observable<PrescriptionBilanDTO[]> {
    return this.http.get<PrescriptionBilanDTO[]>(`${this.base}/prescriptions-bilan/medecin/${medecinId}`).pipe(
      catchError(e => throwError(() => ({ message: e?.error?.message ?? e?.message ?? 'Erreur chargement' })))
    );
  }

  // ——— Résultats labtest (interprétation auto + alertes côté backend) ———
  createResultat(dto: ResultatLabtestDTO, ageMois?: number, sexe?: SexeNorme): Observable<ResultatLabtestDTO> {
    let params = new HttpParams();
    if (ageMois != null) params = params.set('ageMois', String(ageMois));
    if (sexe) params = params.set('sexe', sexe);
    const opts = params.keys().length ? { params } : {};
    return this.http.post<ResultatLabtestDTO>(`${this.base}/resultats-labtest`, dto, opts).pipe(
      catchError(e => throwError(() => ({ message: e?.error?.message ?? e?.message ?? 'Erreur enregistrement résultat' })))
    );
  }

  validerResultat(resultatId: number, medecinId: number): Observable<ResultatLabtestDTO> {
    return this.http.post<ResultatLabtestDTO>(
      `${this.base}/resultats-labtest/valider/${resultatId}`,
      null,
      { params: { medecinId: String(medecinId) } }
    ).pipe(
      catchError(e => throwError(() => ({ message: e?.error?.message ?? e?.message ?? 'Erreur validation' })))
    );
  }

  getResultatsByPrescription(prescriptionId: number): Observable<ResultatLabtestDTO[]> {
    return this.http.get<ResultatLabtestDTO[]>(`${this.base}/resultats-labtest/prescription/${prescriptionId}`).pipe(
      catchError(e => throwError(() => ({ message: e?.error?.message ?? e?.message ?? 'Erreur chargement' })))
    );
  }

  getResultatsByDossier(dossierId: number): Observable<ResultatLabtestDTO[]> {
    return this.http.get<ResultatLabtestDTO[]>(`${this.base}/resultats-labtest/dossier/${dossierId}`).pipe(
      catchError(e => throwError(() => ({ message: e?.error?.message ?? e?.message ?? 'Erreur chargement' })))
    );
  }

  // ——— Rapports bilan (partage famille) ———
  createRapportBilan(dto: RapportBilanDTO): Observable<RapportBilanDTO> {
    return this.http.post<RapportBilanDTO>(`${this.base}/rapports-bilan`, dto).pipe(
      catchError(e => throwError(() => ({ message: e?.error?.message ?? e?.message ?? 'Erreur création rapport' })))
    );
  }

  getRapportsByDossier(dossierId: number): Observable<RapportBilanDTO[]> {
    return this.http.get<RapportBilanDTO[]>(`${this.base}/rapports-bilan/dossier/${dossierId}`).pipe(
      catchError(e => throwError(() => ({ message: e?.error?.message ?? e?.message ?? 'Erreur chargement' })))
    );
  }

  /** Rapports partagés à la famille (vue patient). */
  getRapportsFamilleByDossier(dossierId: number): Observable<RapportBilanDTO[]> {
    return this.http.get<RapportBilanDTO[]>(`${this.base}/rapports-bilan/dossier/${dossierId}/famille`).pipe(
      catchError(e => throwError(() => ({ message: e?.error?.message ?? e?.message ?? 'Erreur chargement' })))
    );
  }

  // ——— Alertes labo (médecin) ———
  getAlertesNonAcquittees(): Observable<AlerteLaboDTO[]> {
    return this.http.get<AlerteLaboDTO[]>(`${this.base}/alertes-labo/non-acquittees`).pipe(
      catchError(e => throwError(() => ({ message: e?.error?.message ?? e?.message ?? 'Erreur chargement' })))
    );
  }

  acquitterAlerte(alerteId: number, medecinId: number, actionRealisee?: string): Observable<void> {
    return this.http.post<void>(`${this.base}/alertes-labo/${alerteId}/acquitter`, {
      medecinId,
      actionRealisee: actionRealisee ?? ''
    }).pipe(
      catchError(e => throwError(() => ({ message: e?.error?.message ?? e?.message ?? 'Erreur acquittement' })))
    );
  }

  // ——— Utilitaires (interprétation manuelle, DFG Schwartz) ———
  interpreter(resultatId: number, ageMois: number, sexe: SexeNorme): Observable<ResultatLabtestDTO> {
    const params = { ageMois: String(ageMois), sexe };
    return this.http.post<ResultatLabtestDTO>(`${this.base}/module-labo/interpreter/${resultatId}`, null, { params }).pipe(
      catchError(e => throwError(() => ({ message: e?.error?.message ?? e?.message ?? 'Erreur interprétation' })))
    );
  }

  dfgEstime(tailleCm: number, creatinineUmolL: number, ageMois: number, garcon: boolean): Observable<{ dfgEstime: number | string; unite: string }> {
    const params = {
      tailleCm: String(tailleCm),
      creatinineUmolL: String(creatinineUmolL),
      ageMois: String(ageMois),
      garcon: String(garcon)
    };
    return this.http.get<{ dfgEstime: number | string; unite: string }>(`${this.base}/module-labo/dfg-estime`, { params }).pipe(
      catchError(e => throwError(() => ({ message: e?.error?.message ?? e?.message ?? 'Erreur calcul DFG' })))
    );
  }
}
