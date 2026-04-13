import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MedicationService, MedicationDTO } from '../services/medication';
import { PrescriptionService } from '../services/prescription.service';
import { PrescriptionModalService } from '../services/prescription-modal.service';
import { AppointmentModalService } from '../services/appointment-modal.service';
import { AuthService } from '../auth/auth.service';

type DoseKey = string;
const dk = (medId: number, itemId: number, idx: number): DoseKey =>
  `${medId}_${itemId}_${idx}`;

export interface UniqueDose {
  itemId:    number;
  doseIdx:   number;
  doseLabel: string;
  time:      string;
  med:       MedicationDTO;
  item:      any;
}

export interface HistoryEntry {
  time:   string;
  status: 'TAKEN' | 'DELAYED' | 'MISSED' | 'PENDING';
  notes?: string;
}

@Component({
  selector:    'app-reminder-medica-home',
  standalone:  false,
  templateUrl: './reminder-medica-home.html',
  styleUrls:   ['./reminder-medica-home.css']
})
export class ReminderMedicaHomeComponent implements OnInit {

  @Input() patientId: number | null = null;
  apiUrl = '/api';

  medications:       MedicationDTO[] = [];
  prescriptionItems: any[]           = [];

  todayLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  private taken:  Set<DoseKey> = new Set();
  private saving: Set<DoseKey> = new Set();
  private missed: Set<DoseKey> = new Set();

  todayCompliance:     any  = null;
  showDoseConfirmModal      = false;
  pendingDoseAction:   any  = null;

  showHistoryModal = false;
  historyMedName   = '';
  historyEntries: HistoryEntry[] = [];

  showScanner = false;

  private colors: Record<string, string> = {
    'immunosuppresseur':  '#7c3aed',
    'antipyrétique':      '#f59e0b',
    'antibiotique':       '#10b981',
    'anti-inflammatoire': '#3b82f6',
    'diurétique':         '#06b6d4',
    'antihypertenseur':   '#ec4899',
    'corticostéroïde':    '#f97316',
    'antiviral':          '#8b5cf6',
    'autre':              '#6b7280',
  };
  private emojis: Record<string, string> = {
    'immunosuppresseur':  '🛡️',
    'antipyrétique':      '🌡️',
    'antibiotique':       '🦠',
    'anti-inflammatoire': '💊',
    'diurétique':         '💧',
    'antihypertenseur':   '❤️',
    'corticostéroïde':    '⚡',
    'antiviral':          '🔬',
    'autre':              '💼',
  };

  constructor(
    private medicationService: MedicationService,
    private prescriptionService: PrescriptionService,
    private prescriptionModal: PrescriptionModalService,
    private appointmentModal: AppointmentModalService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    public auth: AuthService
  ) {}

  /** Ouvre la modal « Mes Ordonnances » gérée par la navbar parente (même flux que l’accueil). */
  openMesOrdonnances(): void {
    this.prescriptionModal.open();
  }

  /** Ouvre la modal de prise de rendez-vous (navbar parente). */
  openRendezVousModal(): void {
    this.appointmentModal.open();
  }

  ngOnInit(): void {
    this.resolvePatientId().then(() => {
      this.loadTakenState();
      this.loadData();
      this.loadCompliance();
    });
  }

  // ══════════════════════════════════════════════
  // RÉSOLUTION PATIENT ID — via Keycloak (AuthService)
  // ══════════════════════════════════════════════
  private async resolvePatientId(): Promise<void> {

    // ── Étape 1 : @Input transmis par le composant parent (home) ──
    if (this.patientId != null && this.patientId > 0) {
      console.log('✅ patientId from @Input:', this.patientId);
      return;
    }

    // ── Étape 2 : localStorage (déjà résolu lors d'une session précédente) ──
    const stored = localStorage.getItem('patientId');
    if (stored) {
      const n = parseInt(stored, 10);
      if (!isNaN(n) && n > 0) {
        this.patientId = n;
        console.log('✅ patientId from localStorage:', this.patientId);
        return;
      }
    }

    // ── Étape 3 : token Keycloak via AuthService ──
    const token = this.auth.getToken();

    if (!token) {
      console.warn('⚠️ Aucun token Keycloak dans reminder');
      this.patientId = null;
      return;
    }

    // Décode le payload JWT
    let payload: any = {};
    try {
      payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch (e) {
      console.warn('⚠️ Impossible de décoder le token Keycloak:', e);
      this.patientId = null;
      return;
    }

    // ── Étape 4 : patientId direct dans le token (si configuré dans Keycloak) ──
    const pidDirect = payload?.idPatient
                   ?? payload?.patientId
                   ?? payload?.patient_id
                   ?? null;

    if (pidDirect != null && !isNaN(Number(pidDirect)) && Number(pidDirect) > 0) {
      this.patientId = Number(pidDirect);
      localStorage.setItem('patientId', String(this.patientId));
      console.log('✅ patientId from JWT claim:', this.patientId);
      return;
    }

    // ── Étape 5 : résolution par username (preferred_username ou sub) ──
    const username = payload?.preferred_username
                  ?? payload?.sub
                  ?? payload?.email
                  ?? null;

    if (!username) {
      console.error('❌ Aucun username dans le token Keycloak (reminder)');
      this.patientId = null;
      return;
    }

    try {
      const patients = await firstValueFrom(
        this.http.get<any[]>('/api/patients')
      );

      const found = Array.isArray(patients)
        ? patients.find(x =>
            x.username === username ||
            x.email    === username ||
            x.login    === username
          )
        : null;

      if (found) {
        const pid = found.idPatient ?? found.id ?? found.patientId;
        if (pid != null && !isNaN(Number(pid))) {
          this.patientId = Number(pid);
          localStorage.setItem('patientId', String(this.patientId));
          console.log('✅ patientId via username match (reminder):', this.patientId);
          return;
        }
      }
    } catch (e) {
      console.error('❌ Erreur /api/patients (reminder):', e);
    }

    console.error('❌ patientId non résolu dans reminder');
    this.patientId = null;
  }

  /* ══ CHARGEMENT ══════════════════════════════ */

  loadData(): void {
    if (this.patientId == null) {
      console.warn('⚠️ Cannot load data: patientId is null');
      this.prescriptionItems = [];
      this.medications = [];
      return;
    }

    this.prescriptionService
      .getActiveByPatient(this.patientId)
      .subscribe({
        next: (prescriptions) => {
          const items: any[] = [];
          (prescriptions || []).forEach(p => {
            if (p.prescriptionItems) items.push(...p.prescriptionItems);
          });
          this.prescriptionItems = items;

          const medIds = [...new Set(items.map((i: any) => i.medicationId as number))];
          this.medicationService.getAllMedications().subscribe({
            next: (meds) => {
              this.medications = medIds.length ? meds.filter(m => medIds.includes(m.id!)) : [];
              this.loadMissedFromHistory();
              this.cdr.detectChanges();
            },
            error: () => { this.medications = []; this.cdr.detectChanges(); }
          });
        },
        error: (e) => {
          console.error('❌ Error loading prescriptions:', e);
          this.prescriptionItems = [];
          this.medications = [];
          this.cdr.detectChanges();
        }
      });
  }

  loadMissedFromHistory(): void {
    if (this.patientId == null) return;
    const today = new Date().toISOString().split('T')[0];
    this.http
      .get<any[]>(`${this.apiUrl}/medication-history/patient/${this.patientId}?date=${today}`)
      .subscribe({
        next: (history) => {
          history.forEach(h => {
            const item = this.prescriptionItems.find(i => i.id === h.prescriptionItemId);
            if (!item) return;
            const k = dk(item.medicationId, item.id, h.doseIndex ?? 0);
            if (h.status === 'MISSED') {
              this.missed.add(k);
            } else if (h.status === 'TAKEN' || h.status === 'DELAYED') {
              this.taken.add(k);
              this.missed.delete(k);
            }
          });
          this.saveTakenState();
          this.cdr.detectChanges();
        },
        error: () => {}
      });
  }

  /* ══ DOSES ════════════════════════════════════ */

  getPrescriptionItems(medId: number | undefined): any[] {
    return medId ? this.prescriptionItems.filter(i => i.medicationId === medId) : [];
  }

  isImmunosuppressorMed(medId: number | undefined): boolean {
    if (!medId) return false;
    return this.getPrescriptionItems(medId).some(i => i.isImmunosuppressor === true);
  }

  getUniqueDoses(medId: number | undefined): UniqueDose[] {
    if (!medId) return [];
    const med = this.medications.find(m => m.id === medId);
    if (!med) return [];
    const result: UniqueDose[] = [];
    let label = 1;
    for (const item of this.getPrescriptionItems(medId)) {
      const count = this.countDoses(item);
      for (let i = 0; i < count; i++) {
        result.push({
          itemId: item.id, doseIdx: i,
          doseLabel: String(label++),
          time: this.getDoseTime(item, i),
          med, item
        });
      }
    }
    return result;
  }

  private countDoses(item: any): number {
    if (Array.isArray(item.scheduledTimes) && item.scheduledTimes.length > 0) {
      return item.scheduledTimes.length;
    }
    if (item.frequencyPerDay && item.frequencyPerDay > 0) {
      return item.frequencyPerDay;
    }
    const n = parseInt(item.frequency, 10);
    return isNaN(n) || n < 1 ? 1 : n;
  }

  getDoseTime(item: any, idx: number): string {
    const raw = Array.isArray(item.scheduledTimes) ? item.scheduledTimes[idx] : null;
    return this.parseTime(raw) ?? this.generateDefaultTime(idx, item);
  }

  private parseTime(raw: any): string | null {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'string') {
      const parts = raw.split(':');
      if (parts.length >= 2) return parts[0].padStart(2,'0') + ':' + parts[1].padStart(2,'0');
    }
    if (Array.isArray(raw) && raw.length >= 2) {
      return String(raw[0]).padStart(2,'0') + ':' + String(raw[1]).padStart(2,'0');
    }
    if (typeof raw === 'object' && raw !== null) {
      const h = raw.hour ?? raw.hours ?? raw.h ?? 0;
      const m = raw.minute ?? raw.minutes ?? raw.m ?? 0;
      return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
    }
    if (typeof raw === 'number') {
      const h = Math.floor(raw);
      const m = Math.round((raw - h) * 60);
      return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
    }
    return null;
  }

  private generateDefaultTime(idx: number, item: any): string {
    const count = this.countDoses(item);
    const defaults: Record<number, string[]> = {
      1: ['08:00'],
      2: ['08:00', '20:00'],
      3: ['08:00', '14:00', '20:00'],
      4: ['08:00', '12:00', '16:00', '20:00'],
      5: ['08:00', '11:00', '14:00', '17:00', '20:00'],
      6: ['07:00', '09:30', '12:00', '14:30', '17:00', '20:00'],
    };
    const slots = defaults[count] ?? defaults[1];
    return slots[idx] ?? '—';
  }

  getDoseMoment(time: string, idx: number): string {
    if (time && time !== '—') {
      const h = parseInt(time.split(':')[0], 10);
      if (!isNaN(h)) {
        if (h >= 6  && h < 12) return 'Matin';
        if (h >= 12 && h < 14) return 'Midi';
        if (h >= 14 && h < 18) return 'Après-midi';
        if (h >= 18 && h < 22) return 'Soir';
        return 'Nuit';
      }
    }
    const moments = ['Matin', 'Midi', 'Soir', 'Nuit'];
    return moments[idx] ?? `Dose ${idx + 1}`;
  }

  /* ══ TOGGLE ═══════════════════════════════════ */

  toggleDoseByKey(med: MedicationDTO, item: any, idx: number): void {
    this.toggleDose(med, item, idx);
  }

  toggleDose(med: MedicationDTO, item: any, idx: number): void {
    const k = dk(med.id!, item.id, idx);
    if (this.taken.has(k) || this.saving.has(k)) return;

    this.saving.add(k);
    this.cdr.detectChanges();

    this.http.post<any>(`${this.apiUrl}/medication-history`, {
      prescriptionItemId: item.id,
      patientId:          this.patientId,
      takenAt:            new Date().toISOString().slice(0, 19),
      status:             'TAKEN',
      actualDosage:       item.dosageInstructions ?? null,
      notes:              `Dose ${idx + 1} — Parent Portal`,
      administeredBy:     'parent',
      sideEffects: null, temperature: null, vitalSigns: null
    }).subscribe({
      next: () => {
        this.saving.delete(k);
        this.taken.add(k);
        this.missed.delete(k);
        this.saveTakenState();
        this.refreshCompliance();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(`Dose ${idx + 1}:`, err);
        this.saving.delete(k);
        this.cdr.detectChanges();
      }
    });
  }

  isDoseTaken  (medId: number | undefined, itemId: number, i: number): boolean { return this.taken.has(dk(medId!, itemId, i)); }
  isDoseSaving (medId: number | undefined, itemId: number, i: number): boolean { return this.saving.has(dk(medId!, itemId, i)); }
  isDoseMissed (medId: number | undefined, itemId: number, i: number): boolean { return this.missed.has(dk(medId!, itemId, i)); }

  isFullyTaken(medId: number | undefined): boolean {
    if (!medId) return false;
    const doses = this.getUniqueDoses(medId);
    return doses.length > 0 && doses.every(d => this.isDoseTaken(medId, d.itemId, d.doseIdx));
  }

  /* ══ HISTORIQUE ══════════════════════════════ */

  openHistory(med: MedicationDTO): void {
    this.historyMedName = med.name ?? '';
    this.historyEntries = [];
    const today = new Date().toISOString().split('T')[0];

    this.http
      .get<any[]>(`${this.apiUrl}/medication-history/patient/${this.patientId}?date=${today}`)
      .subscribe({
        next: (history) => {
          const itemIds = this.getPrescriptionItems(med.id).map(i => i.id);
          const filtered = history.filter(h => itemIds.includes(h.prescriptionItemId));
          this.historyEntries = filtered.length > 0
            ? filtered.map(h => ({
                time:   h.takenAt ? h.takenAt.split('T')[1]?.slice(0, 5) : '—',
                status: h.status,
                notes:  h.notes ?? ''
              }))
            : this.buildLocalHistory(med);
          this.showHistoryModal = true;
          this.cdr.detectChanges();
        },
        error: () => {
          this.historyEntries = this.buildLocalHistory(med);
          this.showHistoryModal = true;
          this.cdr.detectChanges();
        }
      });
  }

  private buildLocalHistory(med: MedicationDTO): HistoryEntry[] {
    return this.getUniqueDoses(med.id).map(dose => {
      const k = dk(med.id!, dose.itemId, dose.doseIdx);
      let status: HistoryEntry['status'] = 'PENDING';
      if (this.taken.has(k))  status = 'TAKEN';
      if (this.missed.has(k)) status = 'MISSED';
      return { time: dose.time, status };
    });
  }

  closeHistoryModal(): void {
    this.showHistoryModal = false;
    this.historyEntries = [];
  }

  /* ══ MODAL CONFIRMATION ═══════════════════════ */

  closeModal(): void {
    this.showDoseConfirmModal = false;
    this.pendingDoseAction = null;
  }

  confirmTakenNow(): void {
    if (!this.pendingDoseAction) return;
    const { med, item, doseIndex } = this.pendingDoseAction;
    const k = dk(med.id!, item.id, doseIndex);

    this.http.post<any>(`${this.apiUrl}/medication-history`, {
      prescriptionItemId: item.id, patientId: this.patientId,
      takenAt: new Date().toISOString().slice(0, 19), status: 'DELAYED',
      actualDosage: item.dosageInstructions ?? null,
      notes: `Dose ${doseIndex + 1} — Retardée`, administeredBy: 'parent',
      sideEffects: null, temperature: null, vitalSigns: null
    }).subscribe({ error: e => console.error('DELAYED:', e) });

    this.taken.add(k);
    this.missed.delete(k);
    this.saveTakenState();
    this.closeModal();
    this.refreshCompliance();
    this.cdr.detectChanges();
  }

  confirmNotTaken(): void {
    if (!this.pendingDoseAction) return;
    const { med, item, doseIndex } = this.pendingDoseAction;
    const k = dk(med.id!, item.id, doseIndex);

    this.http.post<any>(`${this.apiUrl}/medication-history`, {
      prescriptionItemId: item.id, patientId: this.patientId,
      takenAt: new Date().toISOString().slice(0, 19), status: 'MISSED',
      actualDosage: null, notes: `Dose ${doseIndex + 1} — Non prise`, administeredBy: 'parent',
      sideEffects: null, temperature: null, vitalSigns: null
    }).subscribe({
      next: () => { this.missed.add(k); this.saveTakenState(); this.cdr.detectChanges(); },
      error: e => console.error('MISSED:', e)
    });

    this.closeModal();
    this.refreshCompliance();
    this.cdr.detectChanges();
  }

  /* ══ MARQUER TOUT ════════════════════════════ */

  markAllTaken(): void {
    let delay = 0;
    this.medications.forEach(med => {
      this.getUniqueDoses(med.id).forEach(dose => {
        const k = dk(med.id!, dose.itemId, dose.doseIdx);
        if (!this.taken.has(k)) {
          setTimeout(() => this.toggleDose(dose.med, dose.item, dose.doseIdx), delay);
          delay += 200;
        }
      });
    });
  }

  openEmergencyContact(): void { window.location.href = '/emergency'; }

  /* ══ COMPTEURS ═══════════════════════════════ */

  getTotalDosesCount(): number {
    return this.medications.reduce((s, m) => s + this.getUniqueDoses(m.id).length, 0);
  }
  getTakenDosesCount(): number {
    return this.medications.reduce((s, m) =>
      s + this.getUniqueDoses(m.id).filter(d => this.isDoseTaken(m.id, d.itemId, d.doseIdx)).length, 0);
  }
  getPendingDosesCount(): number {
    return this.getTotalDosesCount() - this.getTakenDosesCount();
  }
  getTotalDosesForMed(medId: number | undefined): number {
    return this.getUniqueDoses(medId).length;
  }
  getTakenDosesForMed(medId: number | undefined): number {
    if (!medId) return 0;
    return this.getUniqueDoses(medId).filter(d => this.isDoseTaken(medId, d.itemId, d.doseIdx)).length;
  }
  getAdherencePct(): number {
    const t = this.getTotalDosesCount();
    return t ? Math.round(this.getTakenDosesCount() / t * 100) : 0;
  }

  /* ══ COMPLIANCE ══════════════════════════════ */

  loadCompliance(): void {
    if (this.patientId == null) return;
    this.http
      .get<any>(`${this.apiUrl}/compliance/today/${this.patientId}?patientId=${this.patientId}`)
      .subscribe({
        next: d => { this.todayCompliance = d; this.cdr.detectChanges(); },
        error: () => { this.todayCompliance = this.mockCompliance(); }
      });
  }

  refreshCompliance(): void {
    this.todayCompliance = this.mockCompliance();
    this.cdr.detectChanges();
  }

  private mockCompliance(): any {
    const taken = this.getTakenDosesCount(), total = this.getTotalDosesCount();
    const missed = Math.max(0, total - taken);
    const rate   = total ? taken / total * 100 : 100;
    return {
      patientId: this.patientId, scheduledToday: total, takenToday: taken, missedToday: missed,
      nonCompliant: rate < 100,
      alertLevel: missed === 0 ? 'INFO' : missed === 1 ? 'WARNING' : 'DANGER'
    };
  }

  /* ══ PERSISTANCE sessionStorage ══════════════ */

  private key(): string {
    return `kc_p${this.patientId}_${new Date().toISOString().split('T')[0]}`;
  }

  loadTakenState(): void {
    try {
      this.taken  = new Set(JSON.parse(sessionStorage.getItem(this.key())        ?? '[]'));
      this.missed = new Set(JSON.parse(sessionStorage.getItem(this.key() + '_m') ?? '[]'));
    } catch {
      this.taken  = new Set();
      this.missed = new Set();
    }
  }

  private saveTakenState(): void {
    try {
      sessionStorage.setItem(this.key(),         JSON.stringify([...this.taken]));
      sessionStorage.setItem(this.key() + '_m',  JSON.stringify([...this.missed]));
    } catch {}
  }

  /* ══ UTILITAIRES ══════════════════════════════ */

  getCatColor(cat: string): string { return this.colors[cat?.toLowerCase()] ?? '#6b7280'; }
  getCatEmoji(cat: string): string { return this.emojis[cat?.toLowerCase()] ?? '💊'; }
  truncate(t: string, n: number):   string { return t?.length > n ? t.slice(0, n) + '…' : t ?? ''; }
}