import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import jsPDF from 'jspdf';
import { ConsultationService, PatientDTO } from '../services/consultation.service';

interface PatientOption {
  username: string;
  displayName: string;
}

interface Infection {
  id: number;
  type: string;
  detectionDate: string;
  severity: string;
  patientName: string;
}

interface Vaccination {
  id: number;
  name: string;
  vaccination_date: string;
  booster_date: string;
  infectionId: number | null;
  taken: boolean;
  booster_taken: boolean;
}

// ══════════════════════════════════════
// MEDICAL INTELLIGENCE — INTERFACES
// ══════════════════════════════════════

interface InteractionRule {
  vaccineA: string[];
  vaccineB: string[];
  minDaysBetween: number;
  severity: 'warning' | 'critical';
  reason: string;
}

interface ContraindicationRule {
  vaccineKeywords: string[];
  contraindications: { severities?: string[]; infectionKeywords?: string[] };
  severity: 'warning' | 'critical';
  message: string;
}

interface EfficacyProfile {
  vaccineKeywords: string[];
  fullProtectionDays: number;
  halfLifeDays: number;
  minProtectionPct: number;
}

@Component({
  selector: 'app-infection-vaccination',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './infection-vaccination.html',
  styleUrls: ['./infection-vaccination.css']
})
export class InfectionVaccination implements OnInit {

  activeTab: 'infection' | 'vaccination' = 'vaccination';
  infections: Infection[]   = [];
  vaccinations: Vaccination[] = [];
  newInfection: Infection   = this.emptyInfection();
  newVaccination: Vaccination = this.emptyVaccination();
  editMode = false;
  editId: number | null = null;

  patients: PatientOption[] = [];

  constructor(
    private http: HttpClient,
    private consultationService: ConsultationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
    this.loadPatients();
  }

  /** Libellé affiché pour un identifiant patient stocké (username / ancien libellé). */
  getPatientDisplayLabel(stored: string): string {
    if (!stored?.trim()) return '—';
    const key = stored.trim().toLowerCase();
    const opt = this.patients.find(
      p => p.username === stored || p.username.toLowerCase() === key
    );
    return opt?.displayName ?? stored;
  }

  loadPatients(): void {
    this.consultationService.getPatients().subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.applyPatientsFromDtos(data);
          this.cdr.detectChanges();
          return;
        }
        this.loadPatientsFromGatewayApi();
      },
      error: () => this.loadPatientsFromGatewayApi(),
    });
  }

  private loadPatientsFromGatewayApi(): void {
    this.http.get<any[]>('/api/patients').subscribe({
      next: (data) => {
        this.applyPatientsFromRaw(Array.isArray(data) ? data : []);
        this.cdr.detectChanges();
      },
      error: () => {
        this.patients = [];
        this.cdr.detectChanges();
      },
    });
  }

  private applyPatientsFromDtos(dtos: PatientDTO[]): void {
    this.applyPatientsFromRaw(
      dtos.map((d) => ({
        idPatient: d.idPatient,
        username: d.username,
        email: d.email,
        firstName: d.firstName,
        lastName: d.lastName,
      }))
    );
  }

  private applyPatientsFromRaw(raw: any[]): void {
    const seen = new Set<string>();
    const list: PatientOption[] = [];
    for (const p of raw) {
      const pid = Number(p.idPatient ?? p.id ?? p.patientId);
      const username = String(
        p.username ?? p.login ?? p.email ?? (pid && !Number.isNaN(pid) ? String(pid) : '')
      ).trim();
      if (!username) continue;
      const lk = username.toLowerCase();
      if (seen.has(lk)) continue;
      seen.add(lk);
      const firstName = p.firstName ?? p.prenom ?? '';
      const lastName = p.lastName ?? p.nom ?? '';
      const displayName =
        [firstName, lastName].filter(Boolean).join(' ').trim() ||
        p.username ||
        p.login ||
        p.email ||
        (pid && !Number.isNaN(pid) ? `Patient #${pid}` : username);
      list.push({ username, displayName });
    }
    list.sort((a, b) => a.displayName.localeCompare(b.displayName, 'fr'));
    this.patients = list;
  }

  saveData() {
    localStorage.setItem('infections',  JSON.stringify(this.infections));
    localStorage.setItem('vaccinations', JSON.stringify(this.vaccinations));
  }

  loadData() {
    const inf = localStorage.getItem('infections');
    const vac = localStorage.getItem('vaccinations');
    if (inf) this.infections = JSON.parse(inf);
    if (vac) {
      this.vaccinations = (JSON.parse(vac) as Vaccination[]).map(v => ({
        ...v,
        booster_taken: v.booster_taken ?? false
      }));
    }
  }

  emptyInfection(): Infection {
    return { id: 0, type: '', detectionDate: '', severity: '', patientName: '' };
  }

  emptyVaccination(): Vaccination {
    return { id: 0, name: '', vaccination_date: '', booster_date: '',
             infectionId: null, taken: false, booster_taken: false };
  }

  // ── MARK AS TAKEN ────────────────────────────────────────

  markAsTaken(id: number) {
    const v = this.vaccinations.find(x => x.id === id);
    if (v) { v.taken = true; this.saveData(); }
  }

  markBoosterAsTaken(id: number) {
    const v = this.vaccinations.find(x => x.id === id);
    if (v) { v.booster_taken = true; this.saveData(); }
  }

  // ── DATE STATUS HELPERS ──────────────────────────────────

  private todayStr(): string {
    const d = new Date(); d.setHours(0,0,0,0);
    return d.toISOString().split('T')[0];
  }

  getVacStatus(vac: Vaccination): 'today' | 'overdue' | 'normal' {
    const today = this.todayStr();
    if (!vac.taken && vac.vaccination_date === today)                        return 'today';
    if (!vac.taken && vac.vaccination_date && vac.vaccination_date < today)  return 'overdue';
    return 'normal';
  }

  get vacDuplicateNameError(): string {
    const name = this.newVaccination.name.trim().toLowerCase();
    if (!name) return '';
    const duplicate = this.vaccinations.some(v =>
      v.id !== (this.editId ?? -1) &&
      v.name.trim().toLowerCase() === name
    );
    return duplicate ? `A vaccination named "${this.newVaccination.name.trim()}" already exists.` : '';
  }

  getBoosterStatus(vac: Vaccination): 'today' | 'overdue' | 'normal' | 'none' {
    if (!vac.booster_date) return 'none';
    const today = this.todayStr();
    if (!vac.booster_taken && vac.booster_date === today)   return 'today';
    if (!vac.booster_taken && vac.booster_date < today)     return 'overdue';
    return 'normal';
  }

  getCardStyle(vac: Vaccination): { [key: string]: string } {
    if (vac.taken && (!vac.booster_date || vac.booster_taken)) {
      return { border: '2px solid #86efac', background: '#f0fdf4', opacity: '0.8' };
    }
    const vs = this.getVacStatus(vac);
    const bs = this.getBoosterStatus(vac);
    if (vs === 'overdue') return { border: '2px solid #ef4444', background: '#fff5f5' };
    if (vs === 'today')   return { border: '2px solid #3b82f6', background: '#eff6ff' };
    if (bs === 'overdue') return { border: '2px solid #f97316', background: '#fff7ed' };
    if (bs === 'today')   return { border: '2px solid #3b82f6', background: '#eff6ff' };
    return {};
  }

  switch(tab: 'infection' | 'vaccination') {
    this.activeTab = tab;
    this.resetForms();
  }

  resetForms() {
    this.newInfection   = this.emptyInfection();
    this.newVaccination = this.emptyVaccination();
    this.editMode = false;
    this.editId   = null;
  }

  // =====================================================
  // INFECTION CRUD
  // =====================================================

  saveInfection() {
    this.touchAllInfFields();
    if (!this.infFormValid) return;
    if (this.editMode && this.editId !== null) {
      const i = this.infections.findIndex(x => x.id === this.editId);
      if (i !== -1) this.infections[i] = { ...this.newInfection, id: this.editId };
    } else {
      this.newInfection.id = Date.now();
      this.infections.push({ ...this.newInfection });
    }
    this.saveData();
    this.resetForms();
    this.resetInfTouched();
    this.showForm = false;
  }

  editInfection(item: Infection) {
    this.newInfection = { ...item };
    this.editMode = true;
    this.editId   = item.id;
    this.resetInfTouched();
    this.showForm = true;
  }

  deleteInfection(id: number) {
    this.infections   = this.infections.filter(x => x.id !== id);
    this.vaccinations = this.vaccinations.filter(v => v.infectionId !== id);
    this.saveData();
  }

  // =====================================================
  // VACCINATION CRUD
  // =====================================================

  saveVaccination() {
    this.touchAllVacFields();
    if (!this.vacFormValid) return;
    if (this.editMode && this.editId !== null) {
      const i = this.vaccinations.findIndex(x => x.id === this.editId);
      if (i !== -1) {
        const preserved_booster_taken = this.vaccinations[i].booster_taken;
        this.vaccinations[i] = {
          ...this.newVaccination,
          id: this.editId,
          booster_taken: preserved_booster_taken
        };
      }
    } else {
      this.newVaccination.id           = Date.now();
      this.newVaccination.booster_taken = false;
      this.vaccinations.push({ ...this.newVaccination });
    }
    this.saveData();
    this.resetForms();
    this.resetVacTouched();
    this.showVaccinationForm = false;
  }

  editVaccination(item: Vaccination) {
    this.newVaccination = { ...item };
    this.editMode = true;
    this.editId   = item.id;
    this.resetVacTouched();
    this.showVaccinationForm = true;
  }

  deleteVaccination(id: number) {
    this.vaccinations = this.vaccinations.filter(x => x.id !== id);
    this.saveData();
  }

  // =====================================================
  // RELATIONS
  // =====================================================

  getInfectionName(id: number | null): string {
    if (id === null) return 'None';
    const found = this.infections.find(i => i.id === id);
    return found ? found.type : 'Unknown';
  }

  getPatientNameForVaccination(infectionId: number | null): string {
    if (infectionId === null) return '—';
    const inf = this.infections.find(i => i.id === infectionId);
    return inf?.patientName || '—';
  }

  get infPatientError(): string {
    if (!this.infTouched['patientName']) return '';
    if (!this.newInfection.patientName) return 'Please select a patient.';
    return '';
  }

  // =====================================================
  // FORM VISIBILITY
  // =====================================================

  showForm = false;
  showVaccinationSection = false;
  showVaccinationForm    = false;

  toggleVaccinationSection() {
    this.showVaccinationSection = !this.showVaccinationSection;
    this.showVaccinationForm = false;
    this.resetForms();
  }

  openAddForm() {
    this.loadPatients();
    this.resetForms();
    this.resetInfTouched();
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
    this.resetForms();
    this.resetInfTouched();
  }

  openAddVaccinationForm() {
    this.loadPatients();
    this.resetForms();
    this.resetVacTouched();
    this.showVaccinationForm = true;
  }

  closeVaccinationForm() {
    this.showVaccinationForm = false;
    this.resetForms();
    this.resetVacTouched();
  }

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  showNotificationPanel = false;

  toggleNotificationPanel() {
    this.showNotificationPanel = !this.showNotificationPanel;
  }

  get vaccinationNotifications(): string[] {
    const today = new Date(); today.setHours(0,0,0,0);
    const messages: string[] = [];
    for (const vac of this.vaccinations) {
      if (vac.taken || !vac.vaccination_date) continue;
      const target = new Date(vac.vaccination_date); target.setHours(0,0,0,0);
      const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
      if (diff < 0) {
        const daysAgo = Math.abs(diff);
        messages.push(`🔴|💉 <strong>${vac.name}</strong> vaccination was due <strong>${daysAgo} day${daysAgo === 1 ? '' : 's'} ago</strong> (${vac.vaccination_date})`);
      } else if (diff === 0) {
        messages.push(`💉|💉 Today is the vaccination date for <strong>${vac.name}</strong>!`);
      } else if (diff <= 7) {
        messages.push(`📅|💉 <strong>${vac.name}</strong> vaccination is in <strong>${diff} day${diff === 1 ? '' : 's'}</strong> (${vac.vaccination_date})`);
      }
    }
    return messages;
  }

  get boosterNotifications(): string[] {
    const today = new Date(); today.setHours(0,0,0,0);
    const messages: string[] = [];
    for (const vac of this.vaccinations) {
      if (!vac.booster_date || vac.booster_taken) continue;
      const target = new Date(vac.booster_date); target.setHours(0,0,0,0);
      const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
      if (diff < 0) {
        const daysAgo = Math.abs(diff);
        messages.push(`🟠|🔁 <strong>${vac.name}</strong> booster was due <strong>${daysAgo} day${daysAgo === 1 ? '' : 's'} ago</strong> (${vac.booster_date})`);
      } else if (diff === 0) {
        messages.push(`💉|🔁 Today is the booster date for <strong>${vac.name}</strong>!`);
      } else if (diff <= 7) {
        messages.push(`📅|🔁 <strong>${vac.name}</strong> booster is in <strong>${diff} day${diff === 1 ? '' : 's'}</strong> (${vac.booster_date})`);
      }
    }
    return messages;
  }

  get totalNotificationCount(): number {
    return this.vaccinationNotifications.length + this.boosterNotifications.length;
  }

  showNotifications = true;
  dismissNotifications() { this.showNotifications = false; }

  // =====================================================
  // SEVERITY
  // =====================================================

  readonly severityLevels = ['Asymptomatic', 'Mild', 'Moderate', 'Severe', 'Critical'];

  getSeverityMeter(severity: string): { width: string; color: string } {
    const map: Record<string, { width: string; color: string }> = {
      'Asymptomatic': { width: '10%',  color: '#22c55e' },
      'Mild':         { width: '30%',  color: '#84cc16' },
      'Moderate':     { width: '55%',  color: '#f59e0b' },
      'Severe':       { width: '80%',  color: '#ef4444' },
      'Critical':     { width: '100%', color: '#7f1d1d' },
    };
    return map[severity] ?? { width: '0%', color: '#e2e8f0' };
  }

  // =====================================================
  // INFECTION FILTERS & SORT
  // =====================================================

  infectionSearch     = '';
  infectionSeverity   = '';
  infectionDateSearch = '';
  infectionSortBy:  'type' | 'detectionDate' | 'severity' = 'detectionDate';
  infectionSortDir: 'asc' | 'desc' = 'desc';
  infectionPatientFilter = '';

  get filteredInfections(): Infection[] {
    let list = [...this.infections];
    if (this.infectionSearch.trim())
      list = list.filter(i => i.type.toLowerCase().includes(this.infectionSearch.toLowerCase()));
    if (this.infectionSeverity)
      list = list.filter(i => i.severity === this.infectionSeverity);
    if (this.infectionDateSearch)
      list = list.filter(i => i.detectionDate === this.infectionDateSearch);
    if (this.infectionPatientFilter)
      list = list.filter(i => i.patientName === this.infectionPatientFilter);
    list.sort((a, b) => {
      if (this.infectionSortBy === 'severity') {
        const idxA = this.severityLevels.indexOf(a.severity);
        const idxB = this.severityLevels.indexOf(b.severity);
        return this.infectionSortDir === 'asc' ? idxA - idxB : idxB - idxA;
      }
      const valA = a[this.infectionSortBy] ?? '';
      const valB = b[this.infectionSortBy] ?? '';
      return this.infectionSortDir === 'asc'
        ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
    return list;
  }

  toggleInfectionSort(field: 'type' | 'detectionDate' | 'severity') {
    if (this.infectionSortBy === field)
      this.infectionSortDir = this.infectionSortDir === 'asc' ? 'desc' : 'asc';
    else { this.infectionSortBy = field; this.infectionSortDir = 'asc'; }
  }

  clearInfectionFilters() {
    this.infectionSearch = '';
    this.infectionSeverity = '';
    this.infectionDateSearch = '';
    this.infectionPatientFilter = '';
  }

  // =====================================================
  // VACCINATION FILTERS & SORT
  // =====================================================

  vaccinationSearch      = '';
  vaccinationInfId:       number | null | '' = '';
  vaccinationDateSearch  = '';
  vaccinationSortBy:      'name' | 'vaccination_date' | 'booster_date' = 'vaccination_date';
  vaccinationSortDir:     'asc' | 'desc' = 'desc';
  vaccinationTakenFilter: 'all' | 'taken' | 'not-taken' = 'all';
  vaccinationPatientFilter: string = '';

  get filteredVaccinations(): Vaccination[] {
    let list = [...this.vaccinations];
    if (this.vaccinationSearch.trim())
      list = list.filter(v => v.name.toLowerCase().includes(this.vaccinationSearch.toLowerCase()));
    if (this.vaccinationInfId !== '')
      list = list.filter(v =>
        v.infectionId === (this.vaccinationInfId === null ? null : Number(this.vaccinationInfId))
      );
    if (this.vaccinationDateSearch)
      list = list.filter(v =>
        v.vaccination_date === this.vaccinationDateSearch ||
        v.booster_date     === this.vaccinationDateSearch
      );
    if (this.vaccinationTakenFilter === 'taken')
      list = list.filter(v => v.taken);
    else if (this.vaccinationTakenFilter === 'not-taken')
      list = list.filter(v => !v.taken);
    if (this.vaccinationPatientFilter)
      list = list.filter(v =>
        this.getPatientNameForVaccination(v.infectionId) === this.vaccinationPatientFilter
      );
    list.sort((a, b) => {
      const valA = a[this.vaccinationSortBy] ?? '';
      const valB = b[this.vaccinationSortBy] ?? '';
      return this.vaccinationSortDir === 'asc'
        ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
    return list;
  }

  toggleVaccinationSort(field: 'name' | 'vaccination_date' | 'booster_date') {
    if (this.vaccinationSortBy === field)
      this.vaccinationSortDir = this.vaccinationSortDir === 'asc' ? 'desc' : 'asc';
    else { this.vaccinationSortBy = field; this.vaccinationSortDir = 'asc'; }
  }

  clearVaccinationFilters() {
    this.vaccinationSearch = '';
    this.vaccinationInfId = '';
    this.vaccinationDateSearch = '';
    this.vaccinationTakenFilter = 'all';
    this.vaccinationPatientFilter = '';
  }

  // =====================================================
  // PROGRESS
  // =====================================================

get vaccinationProgress(): { taken: number; total: number; score: number; label: string } {
  let list = this.vaccinations;
  if (this.progressPatientFilter) {
    list = list.filter(v =>
      this.getPatientNameForVaccination(v.infectionId) === this.progressPatientFilter
    );
  }
  const total = list.length;
  const taken = list.filter(v => v.taken).length;
  const label = this.progressPatientFilter
    ? this.getPatientDisplayLabel(this.progressPatientFilter)
    : 'All Patients';
  return { taken, total, score: total === 0 ? 0 : Math.round(taken / total * 100), label };
}

  getProgressGradient(score: number): string {
    if (score <= 25) return 'linear-gradient(90deg, #ef4444, #f97316)';
    if (score <= 50) return 'linear-gradient(90deg, #f97316, #f59e0b)';
    if (score <= 75) return 'linear-gradient(90deg, #f59e0b, #84cc16)';
    return                  'linear-gradient(90deg, #22c55e, #10b981)';
  }

  // =====================================================
  // VACCINATION FORM VALIDATION
  // =====================================================

  vacTouched: Record<string, boolean> = {};

  touchField(field: string) { this.vacTouched[field] = true; }

  get vacNameError(): string {
    if (!this.vacTouched['name']) return '';
    const v = this.newVaccination.name.trim();
    if (!v) return 'Vaccine name is required.';
    return '';
  }

  get vacDateError(): string {
    if (!this.vacTouched['vaccination_date']) return '';
    const v = this.newVaccination.vaccination_date;
    if (!v) return 'Vaccination date is required.';
    const today = new Date(); today.setHours(0,0,0,0);
    const picked = new Date(v); picked.setHours(0,0,0,0);
    if (picked < today) return 'Vaccination date cannot be in the past.';
    return '';
  }

  get vacBoosterError(): string {
    if (!this.vacTouched['booster_date']) return '';
    const b = this.newVaccination.booster_date;
    if (!b) return '';
    const vd = this.newVaccination.vaccination_date;
    if (!vd) return 'Set the vaccination date first.';
    const vacDate   = new Date(vd); vacDate.setHours(0,0,0,0);
    const boostDate = new Date(b);  boostDate.setHours(0,0,0,0);
    const diffDays  = Math.round((boostDate.getTime() - vacDate.getTime()) / 86400000);
    if (diffDays < 3) return 'Booster must be at least 3 days after the vaccination date.';
    return '';
  }

get vacFormValid(): boolean {
  const name = this.newVaccination.name.trim();
  const vd   = this.newVaccination.vaccination_date;
  const bd   = this.newVaccination.booster_date;

  if (!name) return false;
  if (this.vacDuplicateNameError) return false;
  if (!vd) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  const picked = new Date(vd); picked.setHours(0,0,0,0);
  if (picked < today) return false;

  if (bd) {
    const vacDate   = new Date(vd); vacDate.setHours(0,0,0,0);
    const boostDate = new Date(bd); boostDate.setHours(0,0,0,0);
    if (Math.round((boostDate.getTime() - vacDate.getTime()) / 86400000) < 3) return false;
  }

  return true;
}

  touchAllVacFields() {
    ['name', 'vaccination_date', 'booster_date'].forEach(f => this.vacTouched[f] = true);
  }

  resetVacTouched() { this.vacTouched = {}; }

  get todayIso(): string {
    const d = new Date(); d.setHours(0,0,0,0);
    return d.toISOString().split('T')[0];
  }

  get minBoosterDate(): string {
    const vd = this.newVaccination.vaccination_date;
    if (!vd) return this.todayIso;
    const d = new Date(vd); d.setHours(0,0,0,0);
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  }

  // =====================================================
  // INFECTION FORM VALIDATION
  // =====================================================

  infTouched: Record<string, boolean> = {};

  touchInfField(field: string) { this.infTouched[field] = true; }

  get infTypeError(): string {
    if (!this.infTouched['type']) return '';
    const v = this.newInfection.type.trim();
    if (!v) return 'Infection type is required.';
    if (v.length < 3) return 'Must be at least 3 characters.';
    return '';
  }

  get infDuplicateError(): string {
    const type    = this.newInfection.type.trim().toLowerCase();
    const date    = this.newInfection.detectionDate;
    const patient = this.newInfection.patientName;
    if (!type || !date || !patient) return '';
    const duplicate = this.infections.some(i =>
      i.id !== (this.editId ?? -1) &&
      i.type.trim().toLowerCase() === type &&
      i.detectionDate === date &&
      i.patientName === patient
    );
    return duplicate
      ? `${patient} already has a "${this.newInfection.type.trim()}" infection recorded on this date.`
      : '';
  }

  get infSeverityError(): string {
    if (!this.infTouched['severity']) return '';
    if (!this.newInfection.severity) return 'Please select a severity level.';
    return '';
  }

  get infDateError(): string {
    if (!this.infTouched['detectionDate']) return '';
    if (!this.newInfection.detectionDate) return 'Detection date is required.';
    return '';
  }

  get infFormValid(): boolean {
    const type = this.newInfection.type.trim();
    if (!type || type.length < 3)        return false;
    if (!this.newInfection.severity)     return false;
    if (!this.newInfection.detectionDate) return false;
    if (!this.newInfection.patientName)  return false;
    if (this.infDuplicateError)          return false;
    return true;
  }

  touchAllInfFields() {
    ['type', 'severity', 'detectionDate', 'patientName'].forEach(f => this.infTouched[f] = true);
  }

  resetInfTouched() { this.infTouched = {}; }

  // =====================================================
  // DELETE CONFIRMATION
  // =====================================================

  deleteConfirm: { show: boolean; type: 'infection' | 'vaccination'; id: number; name: string } = {
    show: false, type: 'infection', id: 0, name: ''
  };

  askDeleteInfection(id: number, name: string) {
    this.deleteConfirm = { show: true, type: 'infection', id, name };
  }

  askDeleteVaccination(id: number, name: string) {
    this.deleteConfirm = { show: true, type: 'vaccination', id, name };
  }

  confirmDelete() {
    if (this.deleteConfirm.type === 'infection') {
      this.infections   = this.infections.filter(x => x.id !== this.deleteConfirm.id);
      this.vaccinations = this.vaccinations.filter(v => v.infectionId !== this.deleteConfirm.id);
    } else {
      this.vaccinations = this.vaccinations.filter(x => x.id !== this.deleteConfirm.id);
    }
    this.saveData();
    this.cancelDelete();
  }

  cancelDelete() {
    this.deleteConfirm = { show: false, type: 'infection', id: 0, name: '' };
  }

  // ── Certificate Export ───────────────────────────────────────────

  showPatientModal = false;
  certLoading      = false;
  patientTouched: Record<string, boolean> = {};
  patientInfo = { name: '', dob: '', doctor: '', hospital: '' };

  get patientNameError(): string {
    if (!this.patientTouched['name']) return '';
    if (!this.patientInfo.name.trim()) return 'Patient name is required.';
    return '';
  }

  get patientFormValid(): boolean {
    return !!this.patientInfo.name.trim();
  }

  touchPatient(field: string) { this.patientTouched[field] = true; }

  openPatientModal() {
    this.loadPatients();
    this.showPatientModal = true;
    this.patientTouched = {};
  }

  closePatientModal() { this.showPatientModal = false; }

  async exportCertificate() {
    this.patientTouched['name'] = true;
    if (!this.patientFormValid) return;
    this.certLoading = true;

    const patientInfections   = this.infections.filter(i => i.patientName === this.patientInfo.name);
    const patientInfectionIds = new Set(patientInfections.map(i => i.id));
    const patientVaccinations = this.vaccinations.filter(v =>
      v.infectionId !== null && patientInfectionIds.has(v.infectionId)
    );

    const signature = await this.signPayload({
      patient:      this.patientInfo,
      infections:   patientInfections,
      vaccinations: patientVaccinations,
      issuedAt:     new Date().toISOString(),
    });

    const certId = `KC-${signature.substring(0, 16).toUpperCase()}`;
    this.generatePDF(certId, signature, patientInfections, patientVaccinations);

    this.certLoading = false;
    this.closePatientModal();
  }

  private async signPayload(payload: object): Promise<string> {
    const canonical = JSON.stringify(payload, Object.keys(payload).sort());
    const encoder   = new TextEncoder();
    const keyData   = encoder.encode('kidneyCare-client-secret');
    const msgData   = encoder.encode(canonical);
    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['sign']
    );
    const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    return Array.from(new Uint8Array(sigBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private generatePDF(certId: string, signature: string, infections: Infection[], vaccinations: Vaccination[]) {
    const doc  = new jsPDF('p', 'mm', 'a4');
    const W    = 210;
    const pad  = 18;
    const col  = W - pad * 2;
    let   y    = 0;

    const issued = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }) + ' UTC';

    const severityColour: Record<string, [number,number,number]> = {
      'Asymptomatic': [34,  197, 94],
      'Mild':         [132, 204, 22],
      'Moderate':     [245, 158, 11],
      'Severe':       [239, 68,  68],
      'Critical':     [127, 29,  29],
    };

    const fmt = (iso?: string) => {
      if (!iso) return '—';
      try { return new Date(iso).toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' }); }
      catch { return iso; }
    };

    const setFill   = (r:number, g:number, b:number) => doc.setFillColor(r,g,b);
    const setStroke = (r:number, g:number, b:number) => doc.setDrawColor(r,g,b);
    const setTxt    = (r:number, g:number, b:number) => doc.setTextColor(r,g,b);

    const sectionTitle = (text: string, yPos: number): number => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      setTxt(31, 141, 214);
      doc.text(text, pad, yPos);
      setStroke(179, 217, 245);
      doc.line(pad, yPos + 1.5, W - pad, yPos + 1.5);
      return yPos + 7;
    };

    const drawCell = (text: string, x: number, yPos: number, w: number, h: number,
                      bgR=240, bgG=248, bgB=255, bold=false, txtR=55, txtG=65, txtB=81) => {
      setFill(bgR, bgG, bgB);
      setStroke(179, 217, 245);
      doc.rect(x, yPos, w, h, 'FD');
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(8.5);
      setTxt(txtR, txtG, txtB);
      const lines = doc.splitTextToSize(text, w - 4);
      doc.text(lines[0] || '', x + 2, yPos + h/2 + 1.2);
    };

    setFill(31, 141, 214);
    doc.rect(0, 0, W, 26, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    setTxt(255, 255, 255);
    doc.text('KidneyCare', pad, 17);
    doc.setFontSize(11);
    doc.text('OFFICIAL VACCINATION CERTIFICATE', W / 2, 17, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setTxt(191, 219, 254);
    doc.text(`ID: ${certId}`, W - pad, 17, { align: 'right' });

    y = 36;
    y = sectionTitle('Patient Information', y);

    const halfCol = col / 2;
    const cellH   = 9;

    const patientRows = [
      ['Patient Name', this.getPatientDisplayLabel(this.patientInfo.name), 'Date of Birth', fmt(this.patientInfo.dob)],
      ['Hospital', this.patientInfo.hospital || '—', 'Issued On', issued],
    ];

    for (const row of patientRows) {
      drawCell(row[0], pad,             y, halfCol/2, cellH, 240,248,255, true, 107,114,128);
      drawCell(row[1], pad+halfCol/2,   y, halfCol/2, cellH);
      drawCell(row[2], pad+halfCol,     y, halfCol/2, cellH, 240,248,255, true, 107,114,128);
      drawCell(row[3], pad+halfCol*1.5, y, halfCol/2, cellH);
      y += cellH;
    }
    y += 8;

    y = sectionTitle('Vaccination Record', y);
    const vCols = [col*0.24, col*0.20, col*0.20, col*0.18, col*0.18];
    const vHdrs = ['Vaccine', 'Linked Infection', 'Vac. Date', 'Booster Date', 'Status'];
    const infMap: Record<number, string> = {};
    infections.forEach(i => infMap[i.id] = i.type);

    let x = pad;
    for (let c = 0; c < vHdrs.length; c++) {
      drawCell(vHdrs[c], x, y, vCols[c], cellH, 13,59,110, true, 255,255,255);
      x += vCols[c];
    }
    y += cellH;

    for (let idx = 0; idx < vaccinations.length; idx++) {
      const v = vaccinations[idx];
      const bg: [number,number,number] = idx%2 === 0 ? [255,255,255] : [240,248,255];
      const inf = v.infectionId ? (infMap[v.infectionId] || '—') : '—';
      const allDone    = v.taken && (!v.booster_date || v.booster_taken);
      const vacDone    = v.taken && v.booster_date && !v.booster_taken;
      const statusText = allDone ? 'All Done' : vacDone ? 'Vac. Done' : 'Pending';
      const cells = [v.name, inf, fmt(v.vaccination_date), v.booster_date ? fmt(v.booster_date) : '—', statusText];
      x = pad;
      for (let c = 0; c < cells.length; c++) {
        let tr=55,tg=65,tb=81;
        if (c === 4) {
          if (allDone || vacDone) { tr=21;tg=128;tb=61; }
          else { tr=146;tg=64;tb=14; }
        }
        drawCell(cells[c], x, y, vCols[c], cellH, ...bg, false, tr,tg,tb);
        x += vCols[c];
      }
      y += cellH;
      if (y > 265) { doc.addPage(); y = 20; }
    }
    y += 8;

    if (infections.length > 0) {
      y = sectionTitle('Infection History', y);
      const iCols = [col*0.40, col*0.30, col*0.30];
      const iHdrs = ['Type', 'Severity', 'Detected'];
      x = pad;
      for (let c = 0; c < iHdrs.length; c++) {
        drawCell(iHdrs[c], x, y, iCols[c], cellH, 13,59,110, true, 255,255,255);
        x += iCols[c];
      }
      y += cellH;
      for (let idx = 0; idx < infections.length; idx++) {
        const inf = infections[idx];
        const bg: [number,number,number] = idx%2===0 ? [255,255,255] : [240,248,255];
        const sc = severityColour[inf.severity] ?? [148,163,184];
        x = pad;
        drawCell(inf.type,               x, y, iCols[0], cellH, ...bg);               x += iCols[0];
        drawCell(inf.severity || '—',    x, y, iCols[1], cellH, ...bg, true, ...sc);  x += iCols[1];
        drawCell(fmt(inf.detectionDate), x, y, iCols[2], cellH, ...bg);
        y += cellH;
        if (y > 265) { doc.addPage(); y = 20; }
      }
      y += 8;
    }

    if (y > 230) { doc.addPage(); y = 20; }
    setStroke(179, 217, 245);
    doc.line(pad, y, W-pad, y);
    y += 6;
    y = sectionTitle('Digital Signature & Verification', y);

    const sigLines = [
      ['Certificate ID', certId],
      ['HMAC-SHA256',    signature],
      ['Issued On',      issued],
    ];

    for (const [label, value] of sigLines) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      setTxt(107, 114, 128);
      doc.text(label + ':', pad, y);
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      setTxt(55, 65, 81);
      const wrapped = doc.splitTextToSize(value, col - 36);
      doc.text(wrapped, pad + 36, y);
      y += wrapped.length * 4.5 + 2;
    }

    y += 4;
    setStroke(179, 217, 245);
    doc.line(pad, y, W-pad, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setTxt(148, 163, 184);
    const disclaimer =
      'This certificate was generated by KidneyCare Parent Portal. ' +
      'The HMAC-SHA256 signature guarantees it has not been altered since issuance. ' +
      'For medical and administrative use only.';
    const dLines = doc.splitTextToSize(disclaimer, col);
    doc.text(dLines, W/2, y, { align: 'center' });
    doc.save(`vaccination_certificate_${certId}.pdf`);
  }

  // ══════════════════════════════════════
  // RECURRENCE DETECTION
  // ══════════════════════════════════════

  get recurrenceMap(): Record<string, Infection[]> {
    const map: Record<string, Infection[]> = {};
    for (const inf of this.infections) {
      const key = `${(inf.patientName || '').trim().toLowerCase()}::${inf.type.trim().toLowerCase()}`;
      if (!map[key]) map[key] = [];
      map[key].push(inf);
    }
    return map;
  }

  get recurringTypes(): { type: string; patient: string; count: number; infections: Infection[] }[] {
    return Object.entries(this.recurrenceMap)
      .filter(([, list]) => list.length > 1)
      .map(([, list]) => ({
        type:       list[0].type,
        patient:    list[0].patientName || '',
        count:      list.length,
        infections: [...list].sort((a, b) =>
          new Date(a.detectionDate).getTime() - new Date(b.detectionDate).getTime()
        )
      }))
      .sort((a, b) => b.count - a.count);
  }

  getRecurrenceCount(inf: Infection): number {
    const key = `${(inf.patientName || '').trim().toLowerCase()}::${inf.type.trim().toLowerCase()}`;
    return (this.recurrenceMap[key] ?? []).length;
  }

  getRecurrenceLevel(count: number): 'warning' | 'danger' | 'critical' {
    if (count >= 5) return 'critical';
    if (count >= 3) return 'danger';
    return 'warning';
  }

  getRecurrenceColour(count: number): { bg: string; border: string; text: string; dot: string } {
    const level = this.getRecurrenceLevel(count);
    if (level === 'critical') return { bg:'#fef2f2', border:'#ef4444', text:'#991b1b', dot:'#ef4444' };
    if (level === 'danger')   return { bg:'#fff7ed', border:'#f97316', text:'#9a3412', dot:'#f97316' };
    return                           { bg:'#fefce8', border:'#eab308', text:'#854d0e', dot:'#eab308' };
  }

  getRecurrenceSpanDays(infections: Infection[]): number {
    const sorted = [...infections].sort((a, b) =>
      new Date(a.detectionDate).getTime() - new Date(b.detectionDate).getTime()
    );
    const first = new Date(sorted[0].detectionDate);
    const last  = new Date(sorted[sorted.length - 1].detectionDate);
    return Math.round((last.getTime() - first.getTime()) / 86400000);
  }

  getAvgDaysBetween(infections: Infection[]): number {
    if (infections.length < 2) return 0;
    const sorted = [...infections].sort((a, b) =>
      new Date(a.detectionDate).getTime() - new Date(b.detectionDate).getTime()
    );
    let total = 0;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1].detectionDate);
      const curr = new Date(sorted[i].detectionDate);
      total += Math.round((curr.getTime() - prev.getTime()) / 86400000);
    }
    return Math.round(total / (sorted.length - 1));
  }

  showRecurrencePanel = false;

  // ══════════════════════════════════════
  // INFECTION NAME AUTOCOMPLETE
  // ══════════════════════════════════════

  showTypeSuggestions = false;

  readonly infectionSuggestions: string[] = [
    'Urinary Tract Infection (UTI)', 'Pyelonephritis', 'Cystitis', 'Urethritis',
    'Glomerulonephritis', 'Nephrotic Syndrome', 'Nephritis', 'Renal Abscess',
    'Perinephric Abscess', 'Renal Tuberculosis', 'Xanthogranulomatous Pyelonephritis',
    'Emphysematous Pyelonephritis', 'Fungal UTI', 'Candida UTI',
    'Pneumonia', 'Bronchitis', 'Bronchiolitis', 'Tracheitis', 'Laryngitis',
    'Pharyngitis', 'Tonsillitis', 'Sinusitis', 'Rhinitis', 'Influenza',
    'COVID-19', 'Tuberculosis', 'Pleuritis', 'Empyema', 'Lung Abscess',
    'Pertussis', 'Legionella Pneumonia', 'Mycoplasma Pneumonia',
    'Aspergillosis', 'Histoplasmosis', 'Coccidioidomycosis',
    'Gastroenteritis', 'Salmonellosis', 'Shigellosis', 'Campylobacteriosis',
    'Clostridium Difficile', 'Helicobacter Pylori', 'Hepatitis A', 'Hepatitis B',
    'Hepatitis C', 'Hepatitis D', 'Hepatitis E', 'Cholera', 'Typhoid Fever',
    'Appendicitis', 'Peritonitis', 'Diverticulitis',
    'Sepsis', 'Bacteremia', 'Fungemia', 'Endocarditis', 'Pericarditis',
    'Myocarditis', 'Septic Shock', 'MRSA Infection', 'Staphylococcal Infection',
    'Streptococcal Infection', 'E. Coli Infection', 'Klebsiella Infection',
    'Pseudomonas Infection', 'Acinetobacter Infection', 'Enterococcal Infection',
    'Meningitis', 'Encephalitis', 'Brain Abscess', 'Neurocysticercosis',
    'Viral Meningitis', 'Bacterial Meningitis', 'Fungal Meningitis',
    'Cellulitis', 'Erysipelas', 'Impetigo', 'Folliculitis', 'Furuncle',
    'Carbuncle', 'Necrotizing Fasciitis', 'Wound Infection', 'Abscess',
    'Tinea Corporis', 'Tinea Pedis', 'Candidiasis', 'Herpes Zoster',
    'Herpes Simplex', 'Molluscum Contagiosum', 'Scabies',
    'Osteomyelitis', 'Septic Arthritis', 'Prosthetic Joint Infection',
    'Conjunctivitis', 'Keratitis', 'Endophthalmitis', 'Otitis Media',
    'Otitis Externa', 'Mastoiditis',
    'Chlamydia', 'Gonorrhea', 'Syphilis', 'Genital Herpes', 'HIV',
    'Trichomoniasis', 'Human Papillomavirus (HPV)',
    'Malaria', 'Dengue Fever', 'Zika Virus', 'Chikungunya', 'Typhus',
    'Lyme Disease', 'Leishmaniasis', 'Toxoplasmosis', 'Brucellosis',
    'Leptospirosis', 'Rickettsia', 'Yellow Fever', 'West Nile Virus',
    'Measles', 'Mumps', 'Rubella', 'Chickenpox', 'Poliomyelitis',
    'Diphtheria', 'Tetanus', 'Rabies', 'Rotavirus', 'Norovirus',
    'Meningococcal Disease', 'Haemophilus Influenzae',
    'Aspergillus Infection', 'Candida Sepsis', 'Mucormycosis',
    'Cryptococcal Meningitis', 'Pneumocystis Pneumonia',
    'Peritoneal Dialysis-related Peritonitis', 'Catheter-related Bloodstream Infection',
    'Vascular Access Infection', 'Dialysis Access Infection',
    'Post-transplant Infection', 'Cytomegalovirus (CMV)', 'Epstein-Barr Virus (EBV)',
    'BK Virus Nephropathy', 'JC Virus Infection', 'Adenovirus Infection',
  ];

  get filteredTypeSuggestions(): string[] {
    const q = this.newInfection.type.trim().toLowerCase();
    if (!q) return this.infectionSuggestions.slice(0, 8);
    return this.infectionSuggestions.filter(s => s.toLowerCase().includes(q)).slice(0, 10);
  }

  selectSuggestion(name: string) {
    this.newInfection.type = name;
    this.showTypeSuggestions = false;
    this.touchInfField('type');
  }

  onTypeInput() {
    this.showTypeSuggestions = true;
    this.touchInfField('type');
  }

  onTypeBlur() {
    setTimeout(() => { this.showTypeSuggestions = false; }, 180);
  }

  // ══════════════════════════════════════
  // RECURRENCE PREDICTION
  // ══════════════════════════════════════

  showRecurrenceAlert = false;

  getPrediction(rec: { type: string; patient: string; count: number; infections: Infection[] }): {
    chance: number; earliest: string; latest: string; label: string; color: string; reasons: string[];
  } {
    const sorted = [...rec.infections].sort((a, b) =>
      new Date(a.detectionDate).getTime() - new Date(b.detectionDate).getTime()
    );
    const avgDays  = this.getAvgDaysBetween(sorted);
    const lastDate = new Date(sorted[sorted.length - 1].detectionDate);
    lastDate.setHours(0,0,0,0);
    const reasons: string[] = [];

    let chance = Math.min(25 + (rec.count - 1) * 18, 88);
    reasons.push(`${rec.count} recorded episodes give a base recurrence probability of ${chance}%.`);

    if (avgDays > 0 && avgDays <= 30) {
      chance = Math.min(chance + 12, 95);
      reasons.push(`Episodes recur very frequently (avg ${avgDays} days apart) — raised probability by 12%.`);
    } else if (avgDays > 30 && avgDays <= 90) {
      chance = Math.min(chance + 6, 95);
      reasons.push(`Episodes recur moderately (avg ${avgDays} days apart) — raised probability by 6%.`);
    } else if (avgDays > 180) {
      chance = Math.max(chance - 10, 10);
      reasons.push(`Episodes are spread far apart (avg ${avgDays} days) — lowered probability by 10%.`);
    } else {
      reasons.push(`Average interval between episodes is ${avgDays} days.`);
    }

    const severityOrder = ['Asymptomatic', 'Mild', 'Moderate', 'Severe', 'Critical'];
    const lastSev  = severityOrder.indexOf(sorted[sorted.length - 1].severity);
    const firstSev = severityOrder.indexOf(sorted[0].severity);
    if (lastSev > firstSev) {
      chance = Math.min(chance + 8, 95);
      reasons.push(`Severity escalated from ${sorted[0].severity} to ${sorted[sorted.length-1].severity} — raised probability by 8%.`);
    } else if (lastSev < firstSev) {
      chance = Math.max(chance - 6, 10);
      reasons.push(`Severity improved from ${sorted[0].severity} to ${sorted[sorted.length-1].severity} — lowered probability by 6%.`);
    }

    const linkedVac = this.vaccinations.find(v =>
      v.infectionId !== null && rec.infections.some(i => i.id === v.infectionId)
    );
    if (linkedVac) {
      if (linkedVac.taken) {
        const daysSinceVac = Math.round((new Date().getTime() - new Date(linkedVac.vaccination_date).getTime()) / 86400000);
        if (daysSinceVac <= 180) {
          chance = Math.max(chance - 30, 5);
          reasons.push(`Linked vaccination taken ${daysSinceVac} days ago (recent) — lowered probability by 30%.`);
        } else {
          chance = Math.max(chance - 15, 8);
          reasons.push(`Linked vaccination taken ${daysSinceVac} days ago (older) — lowered probability by 15%.`);
        }
        if (linkedVac.booster_taken) {
          chance = Math.max(chance - 10, 5);
          reasons.push(`Booster dose also taken — lowered probability by a further 10%.`);
        }
      } else {
        chance = Math.min(chance + 10, 95);
        reasons.push(`Linked vaccination exists but has not been taken — raised probability by 10%.`);
      }
    } else {
      chance = Math.min(chance + 8, 95);
      reasons.push(`No linked vaccination found for this infection — raised probability by 8%.`);
    }

    const variance  = Math.max(Math.round(avgDays * 0.22), 7);
    const midDate   = new Date(lastDate);
    midDate.setDate(midDate.getDate() + (avgDays || 90));
    const earlyDate = new Date(midDate); earlyDate.setDate(earlyDate.getDate() - variance);
    const lateDate  = new Date(midDate); lateDate.setDate(lateDate.getDate() + variance);
    const fmtDate   = (d: Date) => d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
    reasons.push(`Next predicted window based on last episode + avg interval (${avgDays || 90} days) ± ${variance} days.`);

    let label = 'Low'; let color = '#eab308';
    if (chance >= 70)      { label = 'High';     color = '#ef4444'; }
    else if (chance >= 45) { label = 'Moderate'; color = '#f97316'; }

    return { chance, earliest: fmtDate(earlyDate), latest: fmtDate(lateDate), label, color, reasons };
  }

  get allPredictions(): {
    type: string; patient: string; count: number; infections: Infection[];
    prediction: ReturnType<InfectionVaccination['getPrediction']>;
  }[] {
    return this.recurringTypes.map(rec => ({ ...rec, prediction: this.getPrediction(rec) }));
  }

  progressPatientFilter: string = '';

  // ══════════════════════════════════════
// MEDICAL INTELLIGENCE — RULESETS
// ══════════════════════════════════════

readonly interactionRules: InteractionRule[] = [
  {
    vaccineA: ['mmr', 'measles', 'mumps', 'rubella'],
    vaccineB: ['varicella', 'chickenpox', 'zoster'],
    minDaysBetween: 28,
    severity: 'critical',
    reason: 'Live virus vaccines (MMR & Varicella) must be separated by at least 28 days to avoid immune interference.'
  },
  {
    vaccineA: ['mmr', 'measles', 'mumps', 'rubella'],
    vaccineB: ['influenza', 'flu'],
    minDaysBetween: 28,
    severity: 'warning',
    reason: 'MMR and live attenuated influenza vaccine should be separated by 28 days when not given simultaneously.'
  },
  {
    vaccineA: ['cholera'],
    vaccineB: ['typhoid'],
    minDaysBetween: 8,
    severity: 'warning',
    reason: 'Oral cholera and typhoid vaccines should be separated by at least 8 days due to potential immune interference.'
  },
  {
    vaccineA: ['covid', 'covid-19', 'coronavirus'],
    vaccineB: ['influenza', 'flu'],
    minDaysBetween: 14,
    severity: 'warning',
    reason: 'COVID-19 and influenza vaccines should be separated by 14 days to allow accurate side-effect monitoring.'
  },
  {
    vaccineA: ['bcg', 'yellow fever'],
    vaccineB: ['mmr', 'measles', 'varicella', 'chickenpox'],
    minDaysBetween: 28,
    severity: 'critical',
    reason: 'Two live attenuated vaccines given too close together risk combined immune overload — separate by 28 days.'
  },
  {
    vaccineA: ['pneumococcal', 'pneumonia'],
    vaccineB: ['meningococcal', 'meningitis'],
    minDaysBetween: 7,
    severity: 'warning',
    reason: 'Pneumococcal and meningococcal vaccines given within 7 days may amplify local reactions.'
  }
];

readonly contraindicationRules: ContraindicationRule[] = [
  {
    vaccineKeywords: ['mmr', 'measles', 'varicella', 'chickenpox', 'bcg', 'yellow fever', 'rotavirus'],
    contraindications: { severities: ['Severe', 'Critical'] },
    severity: 'critical',
    message: 'Live vaccines are contraindicated in patients with Severe or Critical active infections due to impaired immune response.'
  },
  {
    vaccineKeywords: ['mmr', 'measles', 'varicella', 'bcg'],
    contraindications: { infectionKeywords: ['nephritis', 'glomerulo', 'renal', 'pyelonephritis', 'nephrotic', 'kidney'] },
    severity: 'warning',
    message: 'Live vaccines should be used with caution in patients with active renal infections — consult a nephrologist before administering.'
  },
  {
    vaccineKeywords: ['hepatitis b', 'hep b'],
    contraindications: { infectionKeywords: ['hepatitis', 'liver'] },
    severity: 'warning',
    message: 'Hepatitis B vaccine in a patient with active hepatitis — monitor liver enzymes and confirm with a specialist before proceeding.'
  },
  {
    vaccineKeywords: ['influenza', 'flu'],
    contraindications: { severities: ['Critical'] },
    severity: 'critical',
    message: 'Influenza vaccine is contraindicated during a critical active infection — defer until the patient stabilises.'
  },
  {
    vaccineKeywords: ['typhoid'],
    contraindications: { infectionKeywords: ['typhoid', 'salmonella'] },
    severity: 'warning',
    message: 'Typhoid vaccine should not be given during an active Salmonella/Typhoid infection — defer until fully recovered.'
  },
  {
    vaccineKeywords: ['cholera'],
    contraindications: { infectionKeywords: ['cholera', 'gastroenteritis'] },
    severity: 'warning',
    message: 'Cholera vaccine should be deferred during active gastrointestinal infection to avoid masking symptoms.'
  }
];

readonly efficacyProfiles: EfficacyProfile[] = [
  { vaccineKeywords: ['hepatitis b', 'hep b'],          fullProtectionDays: 365 * 5,  halfLifeDays: 365 * 3,  minProtectionPct: 20 },
  { vaccineKeywords: ['hepatitis a', 'hep a'],          fullProtectionDays: 365 * 10, halfLifeDays: 365 * 5,  minProtectionPct: 30 },
  { vaccineKeywords: ['influenza', 'flu'],              fullProtectionDays: 150,       halfLifeDays: 80,       minProtectionPct: 5  },
  { vaccineKeywords: ['covid', 'covid-19'],             fullProtectionDays: 150,       halfLifeDays: 90,       minProtectionPct: 10 },
  { vaccineKeywords: ['mmr', 'measles', 'mumps'],       fullProtectionDays: 365 * 20, halfLifeDays: 365 * 10, minProtectionPct: 50 },
  { vaccineKeywords: ['varicella', 'chickenpox'],       fullProtectionDays: 365 * 10, halfLifeDays: 365 * 5,  minProtectionPct: 40 },
  { vaccineKeywords: ['tetanus', 'tdap', 'dtap'],       fullProtectionDays: 365 * 7,  halfLifeDays: 365 * 3,  minProtectionPct: 15 },
  { vaccineKeywords: ['pneumococcal', 'pneumonia'],     fullProtectionDays: 365 * 3,  halfLifeDays: 365 * 2,  minProtectionPct: 10 },
  { vaccineKeywords: ['meningococcal', 'meningitis'],   fullProtectionDays: 365 * 3,  halfLifeDays: 365 * 2,  minProtectionPct: 10 },
  { vaccineKeywords: ['hpv', 'papillomavirus'],         fullProtectionDays: 365 * 10, halfLifeDays: 365 * 5,  minProtectionPct: 40 },
  { vaccineKeywords: ['typhoid'],                       fullProtectionDays: 365 * 2,  halfLifeDays: 365,      minProtectionPct: 10 },
  { vaccineKeywords: ['yellow fever'],                  fullProtectionDays: 365 * 10, halfLifeDays: 365 * 5,  minProtectionPct: 30 },
  { vaccineKeywords: ['rabies'],                        fullProtectionDays: 365,       halfLifeDays: 180,      minProtectionPct: 10 },
  { vaccineKeywords: ['cholera'],                       fullProtectionDays: 180,       halfLifeDays: 90,       minProtectionPct: 5  },
  { vaccineKeywords: ['bcg', 'tuberculosis'],           fullProtectionDays: 365 * 15, halfLifeDays: 365 * 5,  minProtectionPct: 20 },
  { vaccineKeywords: ['rotavirus'],                     fullProtectionDays: 365 * 3,  halfLifeDays: 365,      minProtectionPct: 5  },
];

// ══════════════════════════════════════
// MEDICAL INTELLIGENCE — LOGIC
// ══════════════════════════════════════

private matchesKeywords(name: string, keywords: string[]): boolean {
  const n = name.toLowerCase();
  return keywords.some(k => n.includes(k.toLowerCase()));
}

get vacInteractionWarnings(): { severity: 'warning' | 'critical'; message: string }[] {
  const newName = this.newVaccination.name.trim();
  const newDate = this.newVaccination.vaccination_date;
  if (!newName || !newDate) return [];

  const warnings: { severity: 'warning' | 'critical'; message: string }[] = [];
  const existingVacs = this.vaccinations.filter(v => v.id !== (this.editId ?? -1));

  for (const rule of this.interactionRules) {
    const newMatchesA = this.matchesKeywords(newName, rule.vaccineA);
    const newMatchesB = this.matchesKeywords(newName, rule.vaccineB);
    if (!newMatchesA && !newMatchesB) continue;

    for (const existing of existingVacs) {
      const exMatchesA = this.matchesKeywords(existing.name, rule.vaccineA);
      const exMatchesB = this.matchesKeywords(existing.name, rule.vaccineB);
      if (!((newMatchesA && exMatchesB) || (newMatchesB && exMatchesA))) continue;

      const daysBetween = Math.abs(Math.round(
        (new Date(newDate).getTime() - new Date(existing.vaccination_date).getTime()) / 86400000
      ));

      if (daysBetween < rule.minDaysBetween) {
        warnings.push({
          severity: rule.severity,
          message: `Conflict with "${existing.name}" scheduled ${daysBetween}d apart (min ${rule.minDaysBetween}d required): ${rule.reason}`
        });
      }
    }
  }
  return warnings;
}

get vacContraindicationWarnings(): { severity: 'warning' | 'critical'; message: string }[] {
  const newName = this.newVaccination.name.trim();
  if (!newName) return [];

  const warnings: { severity: 'warning' | 'critical'; message: string }[] = [];
  const linked = this.newVaccination.infectionId
    ? this.infections.find(i => i.id === this.newVaccination.infectionId) ?? null
    : null;
  const relevant = linked ? [linked] : this.infections;

  for (const rule of this.contraindicationRules) {
    if (!this.matchesKeywords(newName, rule.vaccineKeywords)) continue;
    for (const inf of relevant) {
      const severityMatch = rule.contraindications.severities?.includes(inf.severity);
      const keywordMatch  = rule.contraindications.infectionKeywords &&
                            this.matchesKeywords(inf.type, rule.contraindications.infectionKeywords);
      if (severityMatch || keywordMatch) {
        warnings.push({ severity: rule.severity, message: rule.message });
        break;
      }
    }
  }
  // deduplicate
  return warnings.filter((w, i, arr) => arr.findIndex(x => x.message === w.message) === i);
}

get vacFormMedicalWarnings(): { severity: 'warning' | 'critical'; message: string }[] {
  return [...this.vacInteractionWarnings, ...this.vacContraindicationWarnings];
}

getEfficacyPercent(vac: Vaccination): number | null {
  if (!vac.taken || !vac.vaccination_date) return null;
  const profile = this.efficacyProfiles.find(p =>
    this.matchesKeywords(vac.name, p.vaccineKeywords)
  );
  if (!profile) return null;

  const daysSince = Math.round(
    (Date.now() - new Date(vac.vaccination_date).getTime()) / 86400000
  );
  if (daysSince <= 0) return 100;
  if (daysSince <= profile.fullProtectionDays) return 100;

  const daysBeyond = daysSince - profile.fullProtectionDays;
  const pct = Math.round(100 * Math.pow(0.5, daysBeyond / profile.halfLifeDays));
  return Math.max(pct, profile.minProtectionPct);
}

getEfficacyColor(pct: number): string {
  if (pct >= 75) return '#10b981';
  if (pct >= 50) return '#84cc16';
  if (pct >= 25) return '#f59e0b';
  return '#ef4444';
}

readonly vaccineSuggestions: string[] = [
  // From interaction rules
  'MMR (Measles, Mumps, Rubella)',
  'Varicella (Chickenpox)',
  'Influenza (Flu)',
  'COVID-19',
  'BCG (Tuberculosis)',
  'Yellow Fever',
  'Cholera (Oral)',
  'Typhoid',
  'Pneumococcal',
  'Meningococcal',
  // From efficacy profiles
  'Hepatitis B',
  'Hepatitis A',
  'Tetanus (TDaP)',
  'HPV (Human Papillomavirus)',
  'Rabies',
  'Rotavirus',
  // Common extras
  'Diphtheria',
  'Polio (IPV)',
  'Haemophilus Influenzae B (Hib)',
  'Japanese Encephalitis',
  'Dengue',
  'Zoster (Shingles)',
];

showVacNameSuggestions = false;

get filteredVacSuggestions(): string[] {
  const q = this.newVaccination.name.trim().toLowerCase();
  if (!q) return this.vaccineSuggestions.slice(0, 8);
  return this.vaccineSuggestions
    .filter(s => s.toLowerCase().includes(q))
    .slice(0, 10);
}

selectVacSuggestion(name: string) {
  this.newVaccination.name = name;
  this.showVacNameSuggestions = false;
  this.touchField('name');
}

onVacNameBlur() {
  setTimeout(() => { this.showVacNameSuggestions = false; }, 180);
}


getCardMedicalWarnings(vac: Vaccination): { severity: 'warning' | 'critical'; message: string }[] {
  const warnings: { severity: 'warning' | 'critical'; message: string }[] = [];
  const otherVacs = this.vaccinations.filter(v => v.id !== vac.id);

  // Interaction check
  for (const rule of this.interactionRules) {
    const matchesA = this.matchesKeywords(vac.name, rule.vaccineA);
    const matchesB = this.matchesKeywords(vac.name, rule.vaccineB);
    if (!matchesA && !matchesB) continue;

    for (const other of otherVacs) {
      const otherA = this.matchesKeywords(other.name, rule.vaccineA);
      const otherB = this.matchesKeywords(other.name, rule.vaccineB);
      if (!((matchesA && otherB) || (matchesB && otherA))) continue;

      const daysBetween = Math.abs(Math.round(
        (new Date(vac.vaccination_date).getTime() - new Date(other.vaccination_date).getTime()) / 86400000
      ));
      if (daysBetween < rule.minDaysBetween) {
        warnings.push({
          severity: rule.severity,
          message: `Too close to "${other.name}" (${daysBetween}d apart, min ${rule.minDaysBetween}d required): ${rule.reason}`
        });
      }
    }
  }

  // Contraindication check
  for (const rule of this.contraindicationRules) {
    if (!this.matchesKeywords(vac.name, rule.vaccineKeywords)) continue;
    const linked = vac.infectionId
      ? this.infections.filter(i => i.id === vac.infectionId)
      : this.infections;
    for (const inf of linked) {
      const severityMatch = rule.contraindications.severities?.includes(inf.severity);
      const keywordMatch  = rule.contraindications.infectionKeywords &&
                            this.matchesKeywords(inf.type, rule.contraindications.infectionKeywords);
      if (severityMatch || keywordMatch) {
        warnings.push({ severity: rule.severity, message: rule.message });
        break;
      }
    }
  }

  return warnings.filter((w, i, arr) => arr.findIndex(x => x.message === w.message) === i);
}

}