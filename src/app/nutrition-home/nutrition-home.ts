import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NutritionService } from '../services/nutrition';
import {
  BesoinNutritionnelDTO,
  RestrictionAlimentaireDTO,
  AlerteNutritionDTO,
  AlimentDTO,
  CATEGORIE_LABELS,
  RAISON_RESTRICTION_LABELS,
  TYPE_ALERTE_LABELS
} from '../services/nutrition';

@Component({
  selector: 'app-nutrition-home',
  templateUrl: './nutrition-home.component.html',  // ← CORRECTION
  styleUrls: ['./nutrition-home.component.css']    // ← CORRECTION
})
export class NutritionHomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Données
  patientId: number = 1; // ID du patient (à adapter selon votre système d'authentification)
  besoinActif: BesoinNutritionnelDTO | null = null;
  restrictionsActives: RestrictionAlimentaireDTO[] = [];
  alertesNonLues: AlerteNutritionDTO[] = [];
  aliments: AlimentDTO[] = [];

  // Labels
  categorieLabels = CATEGORIE_LABELS;
  raisonLabels = RAISON_RESTRICTION_LABELS;
  typeAlerteLabels = TYPE_ALERTE_LABELS;

  // UI State
  loading = true;
  showBesoinDetails = false;
  selectedAlerte: AlerteNutritionDTO | null = null;
  showAlerteModal = false;

  constructor(private nutritionService: NutritionService) {}

  ngOnInit(): void {
    this.loadPatientData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHARGEMENT DES DONNÉES
  // ═══════════════════════════════════════════════════════════════════════════

  loadPatientData(): void {
    this.loading = true;

    // Charger les aliments d'abord
    this.nutritionService.getAllAliments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.aliments = data;
          this.loadBesoinActif();
        },
        error: (err) => {
          console.error('Erreur chargement aliments:', err);
          this.loading = false;
        }
      });
  }

  loadBesoinActif(): void {
    this.nutritionService.getActiveBesoinForPatient(this.patientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.besoinActif = data;
          this.loadRestrictions();
        },
        error: (err) => {
          console.error('Erreur chargement besoin:', err);
          this.besoinActif = null;
          this.loadRestrictions();
        }
      });
  }

  loadRestrictions(): void {
    this.nutritionService.getActiveRestrictionsForPatient(this.patientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.restrictionsActives = data;
          this.loadAlertes();
        },
        error: (err) => {
          console.error('Erreur chargement restrictions:', err);
          this.restrictionsActives = [];
          this.loadAlertes();
        }
      });
  }

  loadAlertes(): void {
    this.nutritionService.getUnreadAlertesForPatient(this.patientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.alertesNonLues = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur chargement alertes:', err);
          this.alertesNonLues = [];
          this.loading = false;
        }
      });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  toggleBesoinDetails(): void {
    this.showBesoinDetails = !this.showBesoinDetails;
  }

  openAlerteDetails(alerte: AlerteNutritionDTO): void {
    this.selectedAlerte = alerte;
    this.showAlerteModal = true;
  }

  closeAlerteModal(): void {
    this.showAlerteModal = false;
    this.selectedAlerte = null;
  }

  markAlerteAsRead(alerte: AlerteNutritionDTO): void {
    if (alerte.id) {
      this.nutritionService.markAlerteAsRead(alerte.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadAlertes();
            this.closeAlerteModal();
          },
          error: (err) => console.error('Erreur marquage alerte:', err)
        });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  getAlimentNom(alimentId: number): string {
    const aliment = this.aliments.find(a => a.id === alimentId);
    return aliment ? aliment.nom : `Aliment #${alimentId}`;
  }

getRaisonLabel(raison: string): string {
  return this.raisonLabels[raison as keyof typeof this.raisonLabels] || raison;
}

getTypeAlerteLabel(type: string): string {
  return this.typeAlerteLabels[type as keyof typeof this.typeAlerteLabels] || type;
}

  getAlertePriorityClass(type: string): string {
    switch (type) {
      case 'BILAN_ANORMAL':
      case 'INTERACTION_MEDICAMENT':
        return 'high-priority';
      case 'RESTRICTION_ACTIVEE':
      case 'ALIMENT_INTERDIT_CLIQUE':
        return 'medium-priority';
      default:
        return 'low-priority';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getProgressPercentage(current: number, max: number): number {
    return Math.min((current / max) * 100, 100);
  }
}