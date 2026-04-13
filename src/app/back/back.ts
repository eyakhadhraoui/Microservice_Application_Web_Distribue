import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { DashboardStatsService, DashboardStats } from '../services/dashboard-stats';
import { DossierService } from '../services/dossier';
import { ResultatLaboratoireService } from '../services/resultat-laboratoire';
import { TestLaboratoireService } from '../services/test-laboratoire';
import { DashboardNotificationService } from '../services/dashboard-notification.service';

/** Couleurs du donut (vert, bleu, orange, violet) */
const DONUT_COLORS = ['#48bb78', '#4299e1', '#ed8936', '#9f7aea'];

export interface DonutStat {
  label: string;
  count: number;
  color: string;
}

@Component({
  selector: 'app-back',
  standalone: false,
  templateUrl: './back.html',
  styleUrl: './back.css',
})
export class Back implements OnInit {
  notifications = 3;
  /** Nombre de tests labo à afficher dans la notification (nouveaux depuis dernière visite, ou tous à la première visite) */
  newTestsCount = 0;
  /** True à la première visite (pas encore de « dernière visite » enregistrée) */
  isFirstVisit = false;
  /** Afficher la bannière de notification (peut être masquée par l'utilisateur) */
  showNewTestNotification = true;
  stats: DashboardStats = {
    dossiersMedicaux: 0,
    suivis: 0,
    typesTestsLabo: 0,
    resultatsLabo: 0,
  };
  loadingStats = true;
  errorStats: string | null = null;

  /** Donut par diagnostic (dossiers) */
  diagnosticStats: DonutStat[] = [];
  totalDossiersDonut = 0;
  donutGradientDiagnostic = 'conic-gradient(#e2e8f0 0deg 360deg)';
  loadingDonutDiagnostic = true;

  /** Donut par type de test (résultats) */
  donutStats: DonutStat[] = [];
  totalDonut = 0;
  donutGradient = 'conic-gradient(#e2e8f0 0deg 360deg)';
  loadingDonut = true;

  doctor = {
    name: 'Dr. Sarah Dupont',
    role: 'Néphrologue',
    initials: 'SD'
  };

  patients = [
    {
      initials: 'EJ',
      name: 'Emma Johnson',
      age: 7,
      graft: '6 mois',
      status: 'Stable',
      creatinine: '52 µmol/L',
      lastCheck: 'Il y a 2 jours'
    },
    {
      initials: 'LT',
      name: 'Lucas Thompson',
      age: 9,
      graft: '2 ans',
      status: 'CKD Stage 2',
      creatinine: '70 µmol/L',
      lastCheck: 'Il y a 1 semaine'
    }
  ];

  constructor(
    private dashboardStats: DashboardStatsService,
    private dossierService: DossierService,
    private resultatLaboratoireService: ResultatLaboratoireService,
    private testLaboratoireService: TestLaboratoireService,
    private dashboardNotificationService: DashboardNotificationService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadDonutByDiagnostic();
    this.loadDonutByTestType();
    this.dashboardNotificationService.newTestsCount$.subscribe(c => (this.newTestsCount = c));
    this.dashboardNotificationService.isFirstVisit$.subscribe(v => (this.isFirstVisit = v));
  }

  dismissNewTestNotification(): void {
    this.showNewTestNotification = false;
  }

  /** Donut : dossiers par diagnostic */
  loadDonutByDiagnostic(): void {
    this.loadingDonutDiagnostic = true;
    this.dossierService.getAllDossiers().subscribe({
      next: (list) => {
        const dossiers = Array.isArray(list) ? list : [];
        const byDiag = new Map<string, number>();
        for (const d of dossiers) {
          const diag = (d.diagnostic || 'AUTRE').toString().trim() || 'AUTRE';
          byDiag.set(diag, (byDiag.get(diag) || 0) + 1);
        }
        this.totalDossiersDonut = dossiers.length;
        this.diagnosticStats = [];
        let idx = 0;
        const entries = Array.from(byDiag.entries()).sort((a, b) => b[1] - a[1]);
        for (const [key, count] of entries) {
          this.diagnosticStats.push({
            label: this.formatDiagnosticLabel(key),
            count,
            color: DONUT_COLORS[idx % DONUT_COLORS.length],
          });
          idx++;
        }
        this.donutGradientDiagnostic = this.buildDonutGradientFrom(this.diagnosticStats, this.totalDossiersDonut);
        this.loadingDonutDiagnostic = false;
      },
      error: () => {
        this.loadingDonutDiagnostic = false;
        this.diagnosticStats = [];
        this.donutGradientDiagnostic = 'conic-gradient(#e2e8f0 0deg 360deg)';
      },
    });
  }

  private formatDiagnosticLabel(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim();
  }

  loadDonutByTestType(): void {
    this.loadingDonut = true;
    forkJoin({
      resultats: this.resultatLaboratoireService.getAll().pipe(catchError(() => of([]))),
      tests: this.testLaboratoireService.getAll().pipe(
        map(list => Array.isArray(list) ? list : []),
        catchError(() => of([]))
      ),
    }).subscribe({
      next: ({ resultats, tests }) => {
        const resultatsList = Array.isArray(resultats) ? resultats : [];
        const testsList = Array.isArray(tests) ? tests : [];
        const testLabels = new Map<number, string>();
        for (const t of testsList) {
          const id = (t as any).idTestLaboratoire ?? (t as any).id_test_laboratoire ?? (t as any).id;
          if (id != null) {
            const nom = (t as any).nomTest ?? (t as any).nom_test ?? (t as any).codeTest ?? (t as any).code_test;
            testLabels.set(Number(id), nom || `Test ${id}`);
          }
        }
        const byTestId = new Map<number, number>();
        for (const r of resultatsList) {
          const id = Number((r as any).idTestLaboratoire ?? (r as any).id_test_laboratoire ?? (r as any).idTest);
          if (!id) continue;
          byTestId.set(id, (byTestId.get(id) || 0) + 1);
        }
        this.totalDonut = resultatsList.length;
        this.donutStats = [];
        let idx = 0;
        const entries = Array.from(byTestId.entries()).sort((a, b) => b[1] - a[1]);
        for (const [testId, count] of entries) {
          const label = testLabels.get(testId) || `Type #${testId}`;
          this.donutStats.push({
            label,
            count,
            color: DONUT_COLORS[idx % DONUT_COLORS.length],
          });
          idx++;
        }
        this.donutGradient = this.buildDonutGradientFrom(this.donutStats, this.totalDonut);
        this.loadingDonut = false;
      },
      error: () => {
        this.loadingDonut = false;
        this.donutStats = [];
        this.donutGradient = 'conic-gradient(#e2e8f0 0deg 360deg)';
      },
    });
  }

  private buildDonutGradientFrom(stats: DonutStat[], total: number): string {
    if (stats.length === 0) {
      return 'conic-gradient(#e2e8f0 0deg 360deg)';
    }
    const totalVal = total || 1;
    let deg = 0;
    const parts = stats.map(s => {
      const pct = (s.count / totalVal) * 360;
      const start = deg;
      deg += pct;
      return `${s.color} ${start}deg ${deg}deg`;
    });
    return `conic-gradient(${parts.join(', ')})`;
  }

  loadStats(): void {
    this.loadingStats = true;
    this.errorStats = null;
    this.dashboardStats.getStats().subscribe({
      next: (s) => {
        this.stats = s;
        this.loadingStats = false;
        this.errorStats = null;
      },
      error: () => {
        this.loadingStats = false;
        this.errorStats = 'Impossible de charger les statistiques.';
      },
    });
  }

  logout() {
    console.log('Déconnexion');
  }

  openDetails(patient: any) {
    console.log('Patient:', patient);
  }
}
