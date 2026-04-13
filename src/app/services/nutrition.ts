import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface BesoinNutritionnelDTO {
  id?: number;
  label?: string;
  [key: string]: unknown;
}
export interface RestrictionAlimentaireDTO {
  id?: number;
  raison?: string;
  [key: string]: unknown;
}
export interface AlerteNutritionDTO {
  id?: number;
  type?: string;
  message?: string;
  date?: string;
  [key: string]: unknown;
}
export interface AlimentDTO {
  id?: number;
  nom?: string;
  categorie?: string;
  [key: string]: unknown;
}

export const CATEGORIE_LABELS: Record<string, string> = {
  legume: 'Vegetables',
  fruit: 'Fruits',
  proteine: 'Protein',
  laitier: 'Dairy',
  sucre: 'Sugars',
};
export const RAISON_RESTRICTION_LABELS: Record<string, string> = {
  potassium: 'Low potassium',
  phosphore: 'Low phosphorus',
  sodium: 'Low sodium',
  liquide: 'Fluid restriction',
};
export const TYPE_ALERTE_LABELS: Record<string, string> = {
  BILAN_ANORMAL: 'Abnormal lab result',
  RESTRICTION_ACTIVEE: 'Restriction activated',
  INTERACTION_MEDICAMENT: 'Drug interaction',
};

/** Mock data for nutrition (API can replace later). */
const MOCK_ALIMENTS: AlimentDTO[] = [
  { id: 1, nom: 'Banana', categorie: 'fruit' },
  { id: 2, nom: 'Spinach', categorie: 'legume' },
  { id: 3, nom: 'Chicken breast', categorie: 'proteine' },
  { id: 4, nom: 'Milk', categorie: 'laitier' },
  { id: 5, nom: 'Apple', categorie: 'fruit' },
  { id: 6, nom: 'Rice', categorie: 'sucre' },
];
const MOCK_BESOIN: BesoinNutritionnelDTO = {
  id: 1,
  label: 'Renal diet – low sodium, controlled potassium and phosphorus',
};
const MOCK_RESTRICTIONS: RestrictionAlimentaireDTO[] = [
  { id: 1, raison: 'potassium' },
  { id: 2, raison: 'phosphore' },
  { id: 3, raison: 'sodium' },
];
const MOCK_ALERTES: AlerteNutritionDTO[] = [
  { id: 1, type: 'RESTRICTION_ACTIVEE', message: 'Low potassium diet activated', date: new Date().toISOString() },
  { id: 2, type: 'BILAN_ANORMAL', message: 'Phosphorus level to monitor', date: new Date().toISOString() },
];

@Injectable({ providedIn: 'root' })
export class NutritionService {
  getBesoinActif(_patientId: number): Observable<BesoinNutritionnelDTO | null> {
    return of(MOCK_BESOIN).pipe(delay(300));
  }
  getRestrictions(_patientId: number): Observable<RestrictionAlimentaireDTO[]> {
    return of(MOCK_RESTRICTIONS).pipe(delay(300));
  }
  getAlertesNonLues(_patientId: number): Observable<AlerteNutritionDTO[]> {
    return of([...MOCK_ALERTES]).pipe(delay(300));
  }
  getAliments(): Observable<AlimentDTO[]> {
    return of([...MOCK_ALIMENTS]).pipe(delay(300));
  }
  marquerAlerteLue(_alerteId: number): Observable<unknown> {
    return of({}).pipe(delay(200));
  }

  /** Aliases for nutrition-home component. */
  getAllAliments(): Observable<AlimentDTO[]> {
    return this.getAliments();
  }
  getActiveBesoinForPatient(patientId: number): Observable<BesoinNutritionnelDTO | null> {
    return this.getBesoinActif(patientId);
  }
  getActiveRestrictionsForPatient(patientId: number): Observable<RestrictionAlimentaireDTO[]> {
    return this.getRestrictions(patientId);
  }
  getUnreadAlertesForPatient(patientId: number): Observable<AlerteNutritionDTO[]> {
    return this.getAlertesNonLues(patientId);
  }
  markAlerteAsRead(alerteId: number): Observable<unknown> {
    return this.marquerAlerteLue(alerteId);
  }
}
