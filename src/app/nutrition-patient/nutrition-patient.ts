import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NutritionService } from '../services/nutrition';
import type { BesoinNutritionnelDTO, RestrictionAlimentaireDTO, AlerteNutritionDTO } from '../services/nutrition';
import { RAISON_RESTRICTION_LABELS, TYPE_ALERTE_LABELS } from '../services/nutrition';

@Component({
  selector: 'app-nutrition-patient',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="nutrition-page">
      <h1>🥗 Nutrition</h1>
      <p class="subtitle">Dietary guidance and restrictions for your care plan</p>

      <div *ngIf="loading" class="nutrition-loading">Loading nutrition data…</div>

      <ng-container *ngIf="!loading">
        <div *ngIf="besoinActif" class="nutrition-card nutrition-card-besoin">
          <h2>Current dietary plan</h2>
          <p class="besoin-label">{{ besoinActif.label }}</p>
        </div>

        <div *ngIf="restrictions.length > 0" class="nutrition-card nutrition-card-restrictions">
          <h2>Dietary restrictions</h2>
          <ul>
            <li *ngFor="let r of restrictions">{{ getRaisonLabel(r.raison) }}</li>
          </ul>
        </div>

        <div *ngIf="alertes.length > 0" class="nutrition-card nutrition-card-alertes">
          <h2>Nutrition alerts</h2>
          <div *ngFor="let a of alertes" class="alerte-item">
            <span class="alerte-type">{{ getTypeLabel(a.type) }}</span>
            <span class="alerte-msg">{{ a.message || a.type }}</span>
          </div>
        </div>

        <div class="nutrition-placeholder" *ngIf="!besoinActif && restrictions.length === 0 && alertes.length === 0">
          <p>Nutritional recommendations are managed by your care team. Contact your nephrologist for personalized dietary advice.</p>
        </div>
      </ng-container>

      <a routerLink="/home" class="btn-link">Back to Home</a>
    </div>
  `,
  styles: [`
    .nutrition-page { padding: 24px; max-width: 600px; }
    .nutrition-page h1 { margin: 0 0 8px; font-size: 24px; color: #1e293b; }
    .subtitle { color: #64748b; margin: 0 0 24px; }
    .nutrition-loading { padding: 16px; color: #64748b; }
    .nutrition-card { background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .nutrition-card h2 { margin: 0 0 12px; font-size: 16px; color: #334155; }
    .besoin-label { margin: 0; color: #475569; }
    .nutrition-card-restrictions ul { margin: 0; padding-left: 20px; color: #475569; }
    .alerte-item { padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
    .alerte-item:last-child { border-bottom: none; }
    .alerte-type { font-weight: 600; color: #64748b; margin-right: 8px; }
    .alerte-msg { color: #475569; }
    .nutrition-placeholder { background: #f0fdf4; border-radius: 12px; padding: 24px; border: 1px dashed #86efac; margin-bottom: 16px; }
    .btn-link { display: inline-block; margin-top: 16px; color: #16a34a; font-weight: 600; }
  `],
})
export class NutritionPatientComponent implements OnInit {
  loading = true;
  besoinActif: BesoinNutritionnelDTO | null = null;
  restrictions: RestrictionAlimentaireDTO[] = [];
  alertes: AlerteNutritionDTO[] = [];
  private patientId = 1;

  constructor(private nutritionService: NutritionService) {}

  ngOnInit(): void {
    this.nutritionService.getBesoinActif(this.patientId).subscribe({
      next: (b) => { this.besoinActif = b; this.loadRestrictions(); },
      error: () => { this.besoinActif = null; this.loadRestrictions(); },
    });
  }

  private loadRestrictions(): void {
    this.nutritionService.getRestrictions(this.patientId).subscribe({
      next: (r) => { this.restrictions = r || []; this.loadAlertes(); },
      error: () => { this.restrictions = []; this.loadAlertes(); },
    });
  }

  private loadAlertes(): void {
    this.nutritionService.getAlertesNonLues(this.patientId).subscribe({
      next: (a) => { this.alertes = a || []; this.loading = false; },
      error: () => { this.alertes = []; this.loading = false; },
    });
  }

  getRaisonLabel(raison?: string): string {
    return (raison && RAISON_RESTRICTION_LABELS[raison]) || raison || '—';
  }

  getTypeLabel(type?: string): string {
    return (type && TYPE_ALERTE_LABELS[type]) || type || '—';
  }
}
