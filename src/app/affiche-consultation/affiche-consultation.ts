import {
  Component,
  OnDestroy,
  OnInit,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError, finalize, timeout } from 'rxjs/operators';
import type { Consultation, Rapport, Rendezvous } from '../services/consultation.service';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

/** Ligne enrichie affichée dans le tableau / export. */
export interface ConsultationDisplayRow {
  idConsultation: number;
  dateConsultation: string;
  diagnostic: string;
  notes: string;
  idDossiermedical?: number;
  patientLabel: string;
  medecinLabel: string;
  rdvId?: number;
  rdvDate?: string;
  rdvEtat?: string;
  rapportId?: number;
  rapportDate?: string;
  rapportSnippet?: string;
  riskScore: number;
  riskLabel: 'Élevé' | 'Modéré' | 'Faible';
}

function consultationIdFromRdv(r: Rendezvous): number | undefined {
  if (r.idConsultation != null && r.idConsultation > 0) {
    return r.idConsultation;
  }
  const c = r.consultation as { idConsultation?: number } | undefined;
  return c?.idConsultation;
}

function consultationIdFromRapport(r: Rapport): number | undefined {
  if (r.idConsultation != null && r.idConsultation > 0) {
    return r.idConsultation;
  }
  return r.consultation?.idConsultation;
}

function snippet(text: string | undefined, max: number): string {
  if (!text?.trim()) {
    return '';
  }
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

@Component({
  selector: 'app-affiche-consultation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './affiche-consultation.html',
  styleUrls: ['./affiche-consultation.css'],
})
export class AfficheConsultationComponent implements OnInit, OnDestroy {
  private readonly BASE = `${environment.projetApiRoot}/consultation`;
  private readonly BASE_RDV = `${environment.projetApiRoot}/rendezvous`;
  private readonly BASE_RAPPORT = `${environment.projetApiRoot}/rapport`;

  private tickHandle: ReturnType<typeof setInterval> | null = null;
  private loadSub: Subscription | null = null;

  loading = false;
  loadError = '';

  nowLabel = '';
  consultationsRaw: Consultation[] = [];
  rendezvousList: Rendezvous[] = [];
  rapportsList: Rapport[] = [];

  searchTerm = '';
  sortOrder: 'recent' | 'ancien' | 'diagnostic' | 'risk' = 'recent';
  filteredRows: ConsultationDisplayRow[] = [];

  /** Onglets principaux (sous la maquette clinique). */
  activeTab: 'consultations' | 'rendezvous' | 'rapports' | 'patients' | 'rdv-today' =
    'consultations';
  /** Filtre risque (onglet consultations uniquement). */
  riskFilter: 'all' | 'critique' | 'eleve' | 'modere' | 'faible' = 'all';
  rdvEtatFilter = 'all';

  filteredRdvs: Rendezvous[] = [];
  filteredRapportsView: Rapport[] = [];
  patientRows: { idPatient: number; label: string }[] = [];
  filteredRdvToday: Rendezvous[] = [];

  toastSuccess = false;
  toastError = false;
  toastMsg = '';

  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.tick();
    this.tickHandle = setInterval(() => this.tick(), 1000);
    void this.auth.ensureValidAccessToken().then(() => this.loadAll());
  }

  ngOnDestroy(): void {
    if (this.tickHandle) {
      clearInterval(this.tickHandle);
      this.tickHandle = null;
    }
    this.loadSub?.unsubscribe();
  }

  tick(): void {
    const d = new Date();
    this.nowLabel = d.toLocaleString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  /**
   * Tri typé : retourne un nouveau tableau du même type T que l'entrée.
   */
  sortArr<T>(items: T[], compare: (a: T, b: T) => number): T[] {
    return [...items].sort(compare);
  }

  getRiskScore(diagnostic: string, notes?: string): number {
    const text = `${diagnostic || ''} ${notes || ''}`.toLowerCase();
    let score = 12;
    const rules: { kw: string; pts: number }[] = [
      { kw: 'urgence', pts: 35 },
      { kw: 'critique', pts: 30 },
      { kw: 'rejet', pts: 28 },
      { kw: 'infection', pts: 22 },
      { kw: 'sepsis', pts: 32 },
      { kw: 'insuffisance', pts: 20 },
      { kw: 'déshydratation', pts: 15 },
      { kw: 'douleur', pts: 10 },
    ];
    for (const r of rules) {
      if (text.includes(r.kw)) {
        score += r.pts;
      }
    }
    return Math.min(100, Math.round(score));
  }

  riskLabelFromScore(score: number): 'Élevé' | 'Modéré' | 'Faible' {
    if (score >= 60) {
      return 'Élevé';
    }
    if (score >= 35) {
      return 'Modéré';
    }
    return 'Faible';
  }

  loadAll(): void {
    this.loading = true;
    this.loadError = '';
    this.loadSub?.unsubscribe();
    const t = 25000;
    const consultations$ = this.http.get<Consultation[]>(`${this.BASE}/me`).pipe(
      timeout(t),
      catchError(() =>
        this.http.get<Consultation[]>(`${this.BASE}/retrieveConsultations`).pipe(
          timeout(t),
          catchError(() => of([] as Consultation[])),
        ),
      ),
    );
    this.loadSub = forkJoin({
      consultations: consultations$,
      rdv: this.http
        .get<Rendezvous[]>(`${this.BASE_RDV}/retrieveRendezvous`)
        .pipe(
          timeout(t),
          catchError(() => of([] as Rendezvous[])),
        ),
      rapports: this.http
        .get<Rapport[]>(`${this.BASE_RAPPORT}/retrieveRapports`)
        .pipe(
          timeout(t),
          catchError(() => of([] as Rapport[])),
        ),
    })
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: ({ consultations, rdv, rapports }) => {
          this.consultationsRaw = Array.isArray(consultations) ? consultations : [];
          this.rendezvousList = Array.isArray(rdv) ? rdv : [];
          this.rapportsList = Array.isArray(rapports) ? rapports : [];
          this.applyFilters();
        },
        error: () => {
          this.loadError = 'Impossible de charger les consultations.';
          this.showToast(false, this.loadError);
        },
      });
  }

  private buildRows(): ConsultationDisplayRow[] {
    return this.consultationsRaw.map((c) => {
      const id = c.idConsultation ?? 0;
      const rdv = this.rendezvousList.find((r) => consultationIdFromRdv(r) === id);
      const rapport = this.rapportsList.find((r) => consultationIdFromRapport(r) === id);
      const diag = c.diagnostic || '';
      const notes = c.notes || '';
      const risk = this.getRiskScore(diag, notes);
      const patient = c.patient;
      const med = c.medecin;
      const patientLabel =
        patient?.idPatient != null ? `Patient #${patient.idPatient}` : '—';
      const medecinLabel = med
        ? `Dr. ${med.prenom || ''} ${med.nom || ''}`.trim() || med.username || `Médecin #${med.idMedecin}`
        : '—';

      return {
        idConsultation: id,
        dateConsultation: c.dateConsultation || '',
        diagnostic: diag,
        notes,
        idDossiermedical: c.idDossiermedical,
        patientLabel,
        medecinLabel,
        rdvId: rdv?.idRendezvous,
        rdvDate: rdv?.dateRendezvous,
        rdvEtat: rdv?.etat,
        rapportId: rapport?.idRapport,
        rapportDate: rapport?.dateRapport,
        rapportSnippet: snippet(rapport?.contenu, 120),
        riskScore: risk,
        riskLabel: this.riskLabelFromScore(risk),
      };
    });
  }

  selectTab(tab: 'consultations' | 'rendezvous' | 'rapports' | 'patients' | 'rdv-today'): void {
    this.activeTab = tab;
    this.applyFilters();
  }

  setRiskFilter(f: 'all' | 'critique' | 'eleve' | 'modere' | 'faible'): void {
    this.riskFilter = f;
    this.applyConsultationFilters();
  }

  /** Catégorie affichée dans les pastilles (seuils alignés sur le score 0–100). */
  rowRiskCategory(r: ConsultationDisplayRow): 'critique' | 'eleve' | 'modere' | 'faible' {
    if (r.riskScore >= 75) {
      return 'critique';
    }
    if (r.riskScore >= 60) {
      return 'eleve';
    }
    if (r.riskScore >= 35) {
      return 'modere';
    }
    return 'faible';
  }

  get riskCounts(): Record<'critique' | 'eleve' | 'modere' | 'faible', number> {
    const base = { critique: 0, eleve: 0, modere: 0, faible: 0 };
    for (const r of this.buildRows()) {
      base[this.rowRiskCategory(r)]++;
    }
    return base;
  }

  get countPatientsUnique(): number {
    const ids = new Set<number>();
    for (const c of this.consultationsRaw) {
      const id = c.patient?.idPatient;
      if (id != null) {
        ids.add(id);
      }
    }
    for (const r of this.rendezvousList) {
      if (r.idPatient != null) {
        ids.add(r.idPatient);
      }
    }
    return ids.size;
  }

  get countRdvToday(): number {
    return this.rendezvousListForToday.length;
  }

  private get rendezvousListForToday(): Rendezvous[] {
    const today = new Date().toISOString().slice(0, 10);
    return this.rendezvousList.filter((r) => (r.dateRendezvous || '').slice(0, 10) === today);
  }

  patientLabelFromRdv(r: Rendezvous): string {
    const p = r.patient as { idPatient?: number; firstName?: string; lastName?: string } | undefined;
    if (p?.firstName || p?.lastName) {
      return `${p.firstName || ''} ${p.lastName || ''}`.trim();
    }
    if (p?.idPatient != null) {
      return `Patient #${p.idPatient}`;
    }
    if (r.idPatient != null) {
      return `Patient #${r.idPatient}`;
    }
    return '—';
  }

  /** Utilisé par le template (les helpers fichier ne sont pas exposés à la vue). */
  idConsultationFromRdv(r: Rendezvous): number | undefined {
    return consultationIdFromRdv(r);
  }

  idConsultationFromRapport(r: Rapport): number | undefined {
    return consultationIdFromRapport(r);
  }

  consultationLabelForId(id: number | undefined): string {
    if (id == null || id <= 0) {
      return '—';
    }
    const c = this.consultationsRaw.find((x) => x.idConsultation === id);
    if (!c) {
      return `Consultation #${id}`;
    }
    const d = (c.diagnostic || '').slice(0, 40);
    return d ? `#${id} — ${d}${d.length >= 40 ? '…' : ''}` : `Consultation #${id}`;
  }

  applyFilters(): void {
    this.applyConsultationFilters();
    this.applyRdvFilters();
    this.applyRapportFilters();
    this.applyPatientRows();
    this.applyRdvTodayFilters();
  }

  private applyConsultationFilters(): void {
    const q = this.searchTerm.trim().toLowerCase();
    let rows = this.buildRows();
    if (this.riskFilter !== 'all') {
      rows = rows.filter((r) => this.rowRiskCategory(r) === this.riskFilter);
    }
    if (q && this.activeTab === 'consultations') {
      rows = rows.filter(
        (r) =>
          r.diagnostic.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q) ||
          r.patientLabel.toLowerCase().includes(q) ||
          r.medecinLabel.toLowerCase().includes(q) ||
          (r.rapportSnippet && r.rapportSnippet.toLowerCase().includes(q)) ||
          String(r.idConsultation).includes(q) ||
          (r.idDossiermedical != null && String(r.idDossiermedical).includes(q)) ||
          (r.rdvId != null && String(r.rdvId).includes(q)) ||
          (r.rapportId != null && String(r.rapportId).includes(q))
      );
    }

    const byDate = (a: ConsultationDisplayRow, b: ConsultationDisplayRow) =>
      new Date(b.dateConsultation).getTime() - new Date(a.dateConsultation).getTime();

    if (this.sortOrder === 'recent') {
      this.filteredRows = this.sortArr(rows, byDate);
    } else if (this.sortOrder === 'ancien') {
      this.filteredRows = this.sortArr(rows, (a, b) => -byDate(a, b));
    } else if (this.sortOrder === 'diagnostic') {
      this.filteredRows = this.sortArr(rows, (a, b) =>
        a.diagnostic.localeCompare(b.diagnostic, 'fr')
      );
    } else {
      this.filteredRows = this.sortArr(rows, (a, b) => b.riskScore - a.riskScore);
    }
  }

  private applyRdvFilters(): void {
    const q = this.searchTerm.trim().toLowerCase();
    let list = [...this.rendezvousList];
    if (this.rdvEtatFilter !== 'all') {
      list = list.filter(
        (r) => (r.etat || '').toLowerCase() === this.rdvEtatFilter.toLowerCase()
      );
    }
    if (q && this.activeTab === 'rendezvous') {
      list = list.filter(
        (r) =>
          String(r.idRendezvous ?? '').includes(q) ||
          (r.dateRendezvous || '').toLowerCase().includes(q) ||
          (r.etat || '').toLowerCase().includes(q) ||
          this.patientLabelFromRdv(r).toLowerCase().includes(q) ||
          String(consultationIdFromRdv(r) ?? '').includes(q)
      );
    }
    list.sort(
      (a, b) =>
        new Date(b.dateRendezvous || 0).getTime() - new Date(a.dateRendezvous || 0).getTime()
    );
    this.filteredRdvs = list;
  }

  private applyRapportFilters(): void {
    const q = this.searchTerm.trim().toLowerCase();
    let list = [...this.rapportsList];
    if (q && this.activeTab === 'rapports') {
      list = list.filter(
        (r) =>
          String(r.idRapport ?? '').includes(q) ||
          (r.dateRapport || '').toLowerCase().includes(q) ||
          (r.contenu || '').toLowerCase().includes(q) ||
          (r.recommendations || '').toLowerCase().includes(q) ||
          String(consultationIdFromRapport(r) ?? '').includes(q)
      );
    }
    list.sort(
      (a, b) =>
        new Date(b.dateRapport || 0).getTime() - new Date(a.dateRapport || 0).getTime()
    );
    this.filteredRapportsView = list;
  }

  private applyPatientRows(): void {
    const map = new Map<number, string>();
    for (const c of this.consultationsRaw) {
      const id = c.patient?.idPatient;
      if (id == null) {
        continue;
      }
      if (!map.has(id)) {
        map.set(id, c.patient ? `Patient #${id}` : `Patient #${id}`);
      }
    }
    for (const r of this.rendezvousList) {
      const id = r.idPatient ?? (r.patient as { idPatient?: number } | undefined)?.idPatient;
      if (id == null) {
        continue;
      }
      const label = this.patientLabelFromRdv(r);
      if (!map.has(id) || map.get(id)?.startsWith('Patient #')) {
        map.set(id, label !== '—' ? label : `Patient #${id}`);
      }
    }
    this.patientRows = [...map.entries()]
      .map(([idPatient, label]) => ({ idPatient, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
    const q = this.searchTerm.trim().toLowerCase();
    if (q && this.activeTab === 'patients') {
      this.patientRows = this.patientRows.filter(
        (p) =>
          p.label.toLowerCase().includes(q) || String(p.idPatient).includes(q)
      );
    }
  }

  private applyRdvTodayFilters(): void {
    let list = [...this.rendezvousListForToday];
    const q = this.searchTerm.trim().toLowerCase();
    if (q && this.activeTab === 'rdv-today') {
      list = list.filter(
        (r) =>
          String(r.idRendezvous ?? '').includes(q) ||
          (r.etat || '').toLowerCase().includes(q) ||
          this.patientLabelFromRdv(r).toLowerCase().includes(q)
      );
    }
    list.sort(
      (a, b) =>
        new Date(a.dateRendezvous || 0).getTime() - new Date(b.dateRendezvous || 0).getTime()
    );
    this.filteredRdvToday = list;
  }

  exportCSV(): void {
    const day = new Date().toISOString().slice(0, 10);
    if (this.activeTab === 'rendezvous') {
      const headers = ['idRendezvous', 'dateRendezvous', 'etat', 'idPatient', 'idConsultation'];
      const lines = [
        headers.join(';'),
        ...this.filteredRdvs.map((r) =>
          [
            r.idRendezvous ?? '',
            this.csvEscape(r.dateRendezvous || ''),
            this.csvEscape(r.etat || ''),
            r.idPatient ?? '',
            consultationIdFromRdv(r) ?? '',
          ].join(';')
        ),
      ];
      this.downloadCsv(lines, `rendezvous_${day}.csv`);
      return;
    }
    if (this.activeTab === 'rapports') {
      const headers = ['idRapport', 'dateRapport', 'idConsultation', 'contenu', 'recommendations'];
      const lines = [
        headers.join(';'),
        ...this.filteredRapportsView.map((r) =>
          [
            r.idRapport ?? '',
            this.csvEscape(r.dateRapport || ''),
            consultationIdFromRapport(r) ?? '',
            this.csvEscape(r.contenu || ''),
            this.csvEscape(r.recommendations || ''),
          ].join(';')
        ),
      ];
      this.downloadCsv(lines, `rapports_${day}.csv`);
      return;
    }
    if (this.activeTab === 'patients') {
      const headers = ['idPatient', 'label'];
      const lines = [
        headers.join(';'),
        ...this.patientRows.map((p) => `${p.idPatient};${this.csvEscape(p.label)}`),
      ];
      this.downloadCsv(lines, `patients_${day}.csv`);
      return;
    }
    if (this.activeTab === 'rdv-today') {
      const headers = ['idRendezvous', 'dateRendezvous', 'etat', 'patient'];
      const lines = [
        headers.join(';'),
        ...this.filteredRdvToday.map((r) =>
          [
            r.idRendezvous ?? '',
            this.csvEscape(r.dateRendezvous || ''),
            this.csvEscape(r.etat || ''),
            this.csvEscape(this.patientLabelFromRdv(r)),
          ].join(';')
        ),
      ];
      this.downloadCsv(lines, `rdv_aujourdhui_${day}.csv`);
      return;
    }
    const headers = [
      'idConsultation',
      'idDossier',
      'dateConsultation',
      'diagnostic',
      'notes',
      'patient',
      'medecin',
      'riskScore',
      'riskLabel',
      'rdvId',
      'rdvDate',
      'rapportId',
      'rapportExtrait',
    ];
    const lines = [
      headers.join(';'),
      ...this.filteredRows.map((r) =>
        [
          r.idConsultation,
          r.idDossiermedical ?? '',
          this.csvEscape(r.dateConsultation),
          this.csvEscape(r.diagnostic),
          this.csvEscape(r.notes),
          this.csvEscape(r.patientLabel),
          this.csvEscape(r.medecinLabel),
          r.riskScore,
          r.riskLabel,
          r.rdvId ?? '',
          this.csvEscape(r.rdvDate || ''),
          r.rapportId ?? '',
          this.csvEscape(r.rapportSnippet || ''),
        ].join(';')
      ),
    ];
    this.downloadCsv(lines, `consultations_${day}.csv`);
  }

  private downloadCsv(lines: string[], filename: string): void {
    const blob = new Blob([lines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast(true, 'Export CSV généré.');
  }

  private csvEscape(s: string): string {
    const v = (s || '').replace(/"/g, '""');
    return `"${v}"`;
  }

  private showToast(ok: boolean, msg: string): void {
    this.toastMsg = msg;
    this.toastSuccess = ok;
    this.toastError = !ok;
    setTimeout(() => {
      this.toastSuccess = false;
      this.toastError = false;
    }, 3200);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.searchTerm) {
      this.searchTerm = '';
      this.applyFilters();
    }
  }

  trackById(_i: number, row: ConsultationDisplayRow): number {
    return row.idConsultation;
  }

  /** Libellé hero selon l’onglet. */
  get heroTitle(): string {
    switch (this.activeTab) {
      case 'consultations':
        return 'Consultations';
      case 'rendezvous':
        return 'Rendez-vous';
      case 'rapports':
        return 'Rapports';
      case 'patients':
        return 'Patients';
      case 'rdv-today':
        return 'Rendez-vous du jour';
      default:
        return 'Consultations';
    }
  }

  get heroSubtitle(): string {
    switch (this.activeTab) {
      case 'consultations':
        return 'Gestion complète · Statuts automatiques · Raccourcis disponibles';
      case 'rendezvous':
        return 'Liste des rendez-vous · Filtre par état · Lien vers édition';
      case 'rapports':
        return 'Rapports liés aux consultations · Aperçu du contenu';
      case 'patients':
        return 'Patients présents dans les consultations et rendez-vous';
      case 'rdv-today':
        return 'Rendez-vous dont la date est aujourd’hui';
      default:
        return '';
    }
  }

  get searchPlaceholder(): string {
    switch (this.activeTab) {
      case 'consultations':
        return 'Rechercher une consultation…';
      case 'rendezvous':
        return 'Rechercher un rendez-vous…';
      case 'rapports':
        return 'Rechercher un rapport…';
      case 'patients':
        return 'Rechercher un patient…';
      case 'rdv-today':
        return 'Rechercher parmi les RDV du jour…';
      default:
        return 'Rechercher…';
    }
  }

  get summaryLine(): string {
    switch (this.activeTab) {
      case 'consultations':
        return `${this.filteredRows.length} consultation(s)`;
      case 'rendezvous':
        return `${this.filteredRdvs.length} rendez-vous`;
      case 'rapports':
        return `${this.filteredRapportsView.length} rapport(s)`;
      case 'patients':
        return `${this.patientRows.length} patient(s)`;
      case 'rdv-today':
        return `${this.filteredRdvToday.length} rendez-vous aujourd’hui`;
      default:
        return '';
    }
  }

  get exportDisabled(): boolean {
    switch (this.activeTab) {
      case 'consultations':
        return !this.filteredRows.length;
      case 'rendezvous':
        return !this.filteredRdvs.length;
      case 'rapports':
        return !this.filteredRapportsView.length;
      case 'patients':
        return !this.patientRows.length;
      case 'rdv-today':
        return !this.filteredRdvToday.length;
      default:
        return true;
    }
  }

  get uniqueRdvEtats(): string[] {
    const s = new Set<string>();
    for (const r of this.rendezvousList) {
      if (r.etat?.trim()) {
        s.add(r.etat.trim());
      }
    }
    return [...s].sort((a, b) => a.localeCompare(b, 'fr'));
  }

  trackByRdvId(_i: number, r: Rendezvous): number {
    return r.idRendezvous ?? _i;
  }

  trackByRapportId(_i: number, r: Rapport): number {
    return r.idRapport ?? _i;
  }

  trackByPatientId(_i: number, p: { idPatient: number }): number {
    return p.idPatient;
  }

  get kpiHighRisk(): number {
    return this.buildRows().filter((r) => r.riskLabel === 'Élevé').length;
  }

  get kpiWithRdv(): number {
    return this.buildRows().filter((r) => r.rdvId != null).length;
  }
}
