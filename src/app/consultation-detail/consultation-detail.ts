import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConsultationService, Consultation } from '../services/consultation.service';
import { environment } from '../../environments/environment';

export interface Rendezvous {
  idRendezvous: number;
  dateRendezvous: Date;
  etat: string;
  consultation?: Consultation;
}

export interface Rapport {
  idRapport: number;
  dateRapport: Date;
  contenu: string;
  recommendations: string;
  consultation?: Consultation;
}

export interface KpiData {
  tauxAnnulation: number;
  moyenneConsultParSemaine: number;
  ratioAvecRapport: number;
  ratioSansRapport: number;
  totalAnomalies: number;
}

export interface Anomalie {
  type: 'danger' | 'warning' | 'info';
  icon: string;
  titre: string;
  description: string;
}

export interface KanbanColumn {
  label: string;
  etat: string;
  etatBackend: string;
  cssClass: string;
  icon: string;
  items: Rendezvous[];
  pagedItems: Rendezvous[];
  currentPage: number;
  pendingChanges: Set<number>;
  saving: boolean;
  saveSuccess: boolean;
}

@Component({
  selector: 'app-consultation-detail',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, FormsModule],
  templateUrl: './consultation-detail.html',
  styleUrls: ['./consultation-detail.css']
})
export class ConsultationDetailComponent implements OnInit {

  private baseConsultUrl = `${environment.projetApiRoot}/consultation`;
  private baseRdvUrl     = `${environment.projetApiRoot}/rendezvous`;
  private baseRapportUrl = `${environment.projetApiRoot}/rapport`;

  // ─── Données brutes ────────────────────────────
  public consultations: Consultation[] = [];
  public rendezvous:    Rendezvous[]   = [];
  public rapports:      Rapport[]      = [];

  // ─── KPI ──────────────────────────────────────
  public kpi: KpiData = {
    tauxAnnulation: 0, moyenneConsultParSemaine: 0,
    ratioAvecRapport: 0, ratioSansRapport: 0, totalAnomalies: 0
  };

  // ─── Anomalies ────────────────────────────────
  public anomalies: Anomalie[] = [];

  // ─── Kanban ───────────────────────────────────
  public kanbanColumns: KanbanColumn[] = [
    { label:'Prévu',    etat:'prévu',    etatBackend:'PREVU',    cssClass:'col-prevu',    icon:'🕐', items:[], pagedItems:[], currentPage:1, pendingChanges:new Set(), saving:false, saveSuccess:false },
    { label:'Planifié', etat:'planifié', etatBackend:'PLANIFIE', cssClass:'col-planifie', icon:'📋', items:[], pagedItems:[], currentPage:1, pendingChanges:new Set(), saving:false, saveSuccess:false },
    { label:'Confirmé', etat:'confirmé', etatBackend:'CONFIRME', cssClass:'col-confirme', icon:'✅', items:[], pagedItems:[], currentPage:1, pendingChanges:new Set(), saving:false, saveSuccess:false },
    { label:'Terminé',  etat:'terminé',  etatBackend:'TERMINE',  cssClass:'col-termine',  icon:'🏁', items:[], pagedItems:[], currentPage:1, pendingChanges:new Set(), saving:false, saveSuccess:false },
    { label:'Annulé',   etat:'annulé',   etatBackend:'ANNULE',   cssClass:'col-annule',   icon:'❌', items:[], pagedItems:[], currentPage:1, pendingChanges:new Set(), saving:false, saveSuccess:false },
  ];

  // ─── Tri & Filtre ─────────────────────────────
  public sortField        = 'date';
  public sortOrder        = 'asc';
  public filterEtat       = '';
  public filterDiagnostic = '';

  // ─── Pagination ───────────────────────────────
  public readonly PAGE_SIZE = 5;

  // ─── Drag & Drop ──────────────────────────────
  public draggedItem:   Rendezvous   | null = null;
  public dragSourceCol: KanbanColumn | null = null;

  // ─── UI ───────────────────────────────────────
  public loading      = true;
  public savingAll    = false;
  public toastSuccess = false;
  public toastError   = false;
  public toastMsg     = '';
  private loadedCount = 0;

  constructor(
    private http: HttpClient,
    private consultationService: ConsultationService
  ) {}

  ngOnInit(): void { this.loadAll(); }

  // ─── Utilitaires template ─────────────────────
  public capAt100(v: number): number { return Math.min(v, 100); }

  get totalPendingChanges(): number {
    return this.kanbanColumns.reduce((acc, col) => acc + col.pendingChanges.size, 0);
  }

  // ─── Chargement (consultations + RDV + rapports du médecin connecté) ───────
  private loadAll(): void {
    this.loading = true; this.loadedCount = 0;
    this.consultationService.getMe().subscribe({
      next: cons => {
        this.consultations = cons;
        const consultIds = new Set(cons.map(c => c.idConsultation).filter((id): id is number => id != null));
        this.http.get<Rendezvous[]>(`${this.baseRdvUrl}/retrieveRendezvous`).subscribe({
          next: d => {
            this.rendezvous = d.filter(r =>
              r.consultation?.idConsultation != null && consultIds.has(r.consultation.idConsultation)
            );
            this.checkAllLoaded();
          },
          error: () => this.checkAllLoaded()
        });
        this.http.get<Rapport[]>(`${this.baseRapportUrl}/retrieveRapports`).subscribe({
          next: d => {
            this.rapports = d.filter(r =>
              r.consultation?.idConsultation != null && consultIds.has(r.consultation.idConsultation)
            );
            this.checkAllLoaded();
          },
          error: () => this.checkAllLoaded()
        });
      },
      error: () => this.checkAllLoaded()
    });
  }

  private checkAllLoaded(): void {
    this.loadedCount++;
    if (this.loadedCount >= 2) {
      this.loading = false;
      this.computeKpi(); this.detectAnomalies(); this.buildKanban();
    }
  }

  // ─── KPI ─────────────────────────────────────
  public computeKpi(): void {
    const total   = this.rendezvous.length;
    const annules = this.rendezvous.filter(r => r.etat?.toLowerCase().includes('annul')).length;
    this.kpi.tauxAnnulation = total > 0 ? Math.round((annules / total) * 100) : 0;

    if (this.consultations.length > 0) {
      const dates = this.consultations
        .map(c => new Date(c.dateConsultation).getTime())
        .filter(t => !isNaN(t)).sort((a, b) => a - b);
      if (dates.length >= 2) {
        const diffSem = (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24 * 7);
        this.kpi.moyenneConsultParSemaine = diffSem > 0
          ? Math.round((this.consultations.length / diffSem) * 10) / 10
          : this.consultations.length;
      } else { this.kpi.moyenneConsultParSemaine = this.consultations.length; }
    }

    const diagsAvecRapport = new Set(
      this.rapports.filter(r => r.consultation?.diagnostic).map(r => r.consultation!.diagnostic)
    );
    const avecRapport = this.consultations.filter(c => diagsAvecRapport.has(c.diagnostic)).length;
    const totalC = this.consultations.length;
    this.kpi.ratioAvecRapport = totalC > 0 ? Math.round((avecRapport / totalC) * 100) : 0;
    this.kpi.ratioSansRapport = 100 - this.kpi.ratioAvecRapport;
  }

  // ─── Anomalies ───────────────────────────────
  public detectAnomalies(): void {
    this.anomalies = [];
    if (this.kpi.tauxAnnulation > 30)
      this.anomalies.push({ type:'danger', icon:'🚨', titre:"Taux d'annulation critique",
        description:`${this.kpi.tauxAnnulation}% des rendez-vous sont annulés. Seuil critique dépassé (30%).` });
    else if (this.kpi.tauxAnnulation > 15)
      this.anomalies.push({ type:'warning', icon:'⚠️', titre:"Taux d'annulation élevé",
        description:`${this.kpi.tauxAnnulation}% des rendez-vous sont annulés.` });

    if (this.kpi.ratioSansRapport > 50)
      this.anomalies.push({ type:'warning', icon:'📋', titre:'Consultations sans rapport',
        description:`${this.kpi.ratioSansRapport}% des consultations n'ont pas de rapport médical associé.` });

    const rdvParDossier: { [key: number]: string[] } = {};
    this.rendezvous.forEach(r => {
      const id = r.consultation?.idDossiermedical;
      if (id != null) {
        if (!rdvParDossier[id]) rdvParDossier[id] = [];
        rdvParDossier[id].push(r.etat?.toLowerCase() || '');
      }
    });
    const dossiersAnnules = Object.entries(rdvParDossier)
      .filter(([_, etats]) => etats.filter(e => e.includes('annul')).length >= 2);
    if (dossiersAnnules.length > 0)
      this.anomalies.push({ type:'danger', icon:'🔴', titre:'Annulations en série détectées',
        description:`${dossiersAnnules.length} dossier(s) avec 2+ rendez-vous annulés.` });

    const actifs = this.rendezvous.filter(r => {
      const e = r.etat?.toLowerCase() || '';
      return e.includes('prévu') || e.includes('prevu') || e.includes('planif') || e.includes('confirm');
    }).length;
    if (this.rendezvous.length > 0 && actifs === 0)
      this.anomalies.push({ type:'info', icon:'📅', titre:'Aucun rendez-vous actif',
        description:'Tous les rendez-vous sont terminés ou annulés.' });

    const sansNotes = this.consultations.filter(c => !c.notes || c.notes.trim() === '').length;
    if (sansNotes > 0)
      this.anomalies.push({ type:'info', icon:'📝', titre:'Consultations sans notes',
        description:`${sansNotes} consultation(s) sans note médicale.` });

    this.kpi.totalAnomalies = this.anomalies.length;
  }

  // ─── Build Kanban ─────────────────────────────
  public buildKanban(): void {
    this.kanbanColumns.forEach(col => { col.items = []; col.currentPage = 1; });
    const norm = (s: string) => s.toLowerCase()
      .replace(/[éèê]/g, 'e').replace(/î/g, 'i')
      .replace(/_/g, '').trim();

    this.rendezvous.forEach(rdv => {
      let matched = false;
      for (const col of this.kanbanColumns) {
        if (
          norm(rdv.etat || '') === norm(col.etat) ||
          norm(rdv.etat || '') === norm(col.etatBackend)
        ) {
          col.items.push(rdv); matched = true; break;
        }
      }
      if (!matched) this.kanbanColumns[0].items.push(rdv);
    });
    this.applyFiltersAndSort();
  }

  // ─── Tri ─────────────────────────────────────
  public setSortField(field: string): void {
    if (this.sortField === field) { this.toggleSortOrder(); return; }
    this.sortField = field;
    this.applyFiltersAndSort();
  }

  public toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFiltersAndSort();
  }

  // ─── Filtres + tri + pagination ───────────────
  public applyFiltersAndSort(): void {
    const diagFilter = (this.filterDiagnostic || '').toLowerCase().trim();

    this.kanbanColumns.forEach(col => {
      let filtered = [...col.items];

      if (this.filterEtat && this.filterEtat !== col.label) {
        filtered = [];
      }

      if (diagFilter) {
        filtered = filtered.filter(r =>
          (r.consultation?.diagnostic || '').toLowerCase().includes(diagFilter)
        );
      }

      filtered.sort((a, b) => {
        let valA: any, valB: any;
        if (this.sortField === 'date') {
          valA = new Date(a.dateRendezvous).getTime();
          valB = new Date(b.dateRendezvous).getTime();
        } else if (this.sortField === 'etat') {
          valA = (a.etat || '').toLowerCase();
          valB = (b.etat || '').toLowerCase();
        } else {
          valA = (a.consultation?.diagnostic || '').toLowerCase();
          valB = (b.consultation?.diagnostic || '').toLowerCase();
        }
        const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
        return this.sortOrder === 'asc' ? cmp : -cmp;
      });

      (col as any)._filteredItems = filtered;
      col.currentPage = 1;
      this.updatePagedItems(col);
    });
  }

  // ─── Pagination par colonne ───────────────────
  public getColTotalPages(col: KanbanColumn): number {
    const items = (col as any)._filteredItems ?? col.items;
    return Math.max(1, Math.ceil(items.length / this.PAGE_SIZE));
  }

  public colGoToPage(col: KanbanColumn, page: number): void {
    if (page < 1 || page > this.getColTotalPages(col)) return;
    col.currentPage = page;
    this.updatePagedItems(col);
  }

  private updatePagedItems(col: KanbanColumn): void {
    const items = (col as any)._filteredItems ?? col.items;
    const start = (col.currentPage - 1) * this.PAGE_SIZE;
    col.pagedItems = items.slice(start, start + this.PAGE_SIZE);
  }

  // ─── Drag & Drop ──────────────────────────────
  public onDragStart(item: Rendezvous, col: KanbanColumn): void {
    this.draggedItem = item; this.dragSourceCol = col;
  }
  public onDragOver(e: DragEvent): void { e.preventDefault(); }

  public onDrop(targetCol: KanbanColumn): void {
    if (!this.draggedItem || !this.dragSourceCol || this.dragSourceCol === targetCol) return;

    const id = this.draggedItem.idRendezvous;

    // Retirer de la source
    this.dragSourceCol.items = this.dragSourceCol.items.filter(i => i.idRendezvous !== id);
    (this.dragSourceCol as any)._filteredItems =
      ((this.dragSourceCol as any)._filteredItems ?? []).filter((i: Rendezvous) => i.idRendezvous !== id);
    this.dragSourceCol.pendingChanges.delete(id);

    // ✅ Valeur enum exacte attendue par le backend
    this.draggedItem.etat = targetCol.etatBackend;

    // Ajouter dans la cible
    targetCol.items.push(this.draggedItem);
    if (!(targetCol as any)._filteredItems) (targetCol as any)._filteredItems = [];
    (targetCol as any)._filteredItems.push(this.draggedItem);

    targetCol.pendingChanges = new Set([...targetCol.pendingChanges, id]);

    this.updatePagedItems(this.dragSourceCol);
    this.updatePagedItems(targetCol);

    this.draggedItem = null; this.dragSourceCol = null;
    this.computeKpi(); this.detectAnomalies();
  }

  public onDragEnd(): void { this.draggedItem = null; this.dragSourceCol = null; }

  // ─── Save colonne (PUT) ───────────────────────
  public saveColumn(col: KanbanColumn): void {
    if (col.pendingChanges.size === 0 || col.saving) return;
    col.saving = true;

    const ids = [...col.pendingChanges];
    const rdvsToSave = col.items.filter(r => ids.includes(r.idRendezvous));
    let done = 0; let errors = 0;
    const total = rdvsToSave.length;

    rdvsToSave.forEach(rdv => {
      // ✅ FIX : même URL (sans ID) et même structure payload que update-rendezvous.ts
      // Le backend Spring Boot attend l'ID dans le body, pas dans l'URL
      const payload = {
        idRendezvous:   rdv.idRendezvous,
        dateRendezvous: rdv.dateRendezvous,
        etat:           rdv.etat,  // ex: 'TERMINE', 'ANNULE', 'CONFIRME', 'PLANIFIE', 'PREVU'
        consultation:   rdv.consultation
          ? { idConsultation: rdv.consultation.idConsultation }
          : null
      };

      // ✅ PUT /updateRendezvous  — sans /{id} dans l'URL, identique à update-rendezvous.ts
      this.http.put(`${this.baseRdvUrl}/updateRendezvous`, payload).subscribe({
        next: () => {
          done++;
          if (done + errors === total) this.onSaveColumnDone(col, errors);
        },
        error: (err) => {
          console.error(`Erreur PUT rdv #${rdv.idRendezvous}`, err);
          errors++;
          if (done + errors === total) this.onSaveColumnDone(col, errors);
        }
      });
    });
  }

  private onSaveColumnDone(col: KanbanColumn, errors: number): void {
    col.saving = false;
    if (errors === 0) {
      col.pendingChanges = new Set();
      col.saveSuccess = true;
      this.showToast(`Colonne "${col.label}" enregistrée avec succès`, 'success');
      setTimeout(() => col.saveSuccess = false, 2500);
    } else {
      this.showToast(`${errors} erreur(s) lors de la sauvegarde dans "${col.label}"`, 'error');
    }
  }

  // ─── Save tout ────────────────────────────────
  public saveAllColumns(): void {
    this.savingAll = true;
    this.kanbanColumns.filter(c => c.pendingChanges.size > 0).forEach(col => this.saveColumn(col));
    setTimeout(() => {
      this.savingAll = false;
      if (this.totalPendingChanges === 0)
        this.showToast('Toutes les modifications enregistrées', 'success');
    }, 1500);
  }

  // ─── Utilitaires ─────────────────────────────
  public getAnomalieClass(type: string): string {
    return type === 'danger' ? 'anomalie-danger' : type === 'warning' ? 'anomalie-warning' : 'anomalie-info';
  }

  public getKpiColor(value: number, warn: number, danger: number): string {
    return value >= danger ? 'kpi-danger' : value >= warn ? 'kpi-warning' : 'kpi-good';
  }

  public showToast(msg: string, type: 'success' | 'error'): void {
    this.toastMsg = msg;
    if (type === 'success') { this.toastSuccess = true; setTimeout(() => this.toastSuccess = false, 3000); }
    else                    { this.toastError   = true; setTimeout(() => this.toastError   = false, 3000); }
  }
}