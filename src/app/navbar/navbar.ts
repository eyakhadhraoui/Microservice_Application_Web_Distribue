import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { KEYCLOAK_ROLES } from '../auth/keycloak-roles';
import { NotificationWebSocketService } from '../services/notification-websocket.service';
import { NotificationService } from '../services/notification.service';
import { AppointmentModalService } from '../services/appointment-modal.service';
import { PrescriptionModalService } from '../services/prescription-modal.service';
import { PrescriptionService, PrescriptionDTO, getPrescriptionPatientId } from '../services/prescription.service';
import jsPDF from 'jspdf';

export interface DoctorAlert {
  idNotificationMedecin: number;
  idPatient?: number;
  patientName?: string;
  message: string;
  titre?: string;
  severity?: string;
  dateCreation: string;
}

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  constructor(
    public auth: AuthService,
    public notificationService: NotificationWebSocketService,
    private router: Router,
    private notification: NotificationService,
    private appointmentModal: AppointmentModalService,
    private prescriptionModal: PrescriptionModalService,
    private prescriptionService: PrescriptionService,
    private http: HttpClient,
  ) {}

  readonly KEYCLOAK_ROLES = KEYCLOAK_ROLES;

  showNotifications = false;
  showProfile = false;
  showAppointmentForm = false;
  showPrescriptionsForm = false;
  showEmergencyForm = false;
  showMedicalReportForm = false;
  showLabResultForm = false;
  showTreatmentForm = false;

  appointmentPatientId = 0;
  loadingSlots = false;
  availableSlots: string[] = [];
  selectedSlot: string | null = null;
  appointmentManualDate = '';
  appointmentStatus = 'PENDING';

  loadingPrescriptions = false;
  prescriptionsList: { id: number; label: string; date: string }[] = [];

  /** Mes Ordonnances (liste + détail) — filtrées par patient */
  showOrdonnancesModal    = false;
  showPrescriptionDetail = false;
  prescriptions: PrescriptionDTO[] = [];
  selectedPrescription: PrescriptionDTO | null = null;
  patientId = 0;
  patientName = '';  /** Nom du patient (firstName lastName) */
  prescPatientUnknown = false;  /** true si patient non identifié */
  isPrescLoading = false;
  today = new Date();

  /** Toast temps réel (nouvelle image médicale, etc.) */
  toastMessage = '';
  toastVisible = false;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private appointmentSub: Subscription | null = null;
  private prescriptionSub: Subscription | null = null;
  private doctorAlertsInterval: ReturnType<typeof setInterval> | null = null;

  /** Alertes médecin (médicament non pris, etc.) */
  doctorAlerts: DoctorAlert[] = [];
  doctorAlertsCount = 0;
  isLoadingDoctorAlerts = false;
  doctorIdMedecin = 0;

  ngOnInit(): void {
    this.appointmentSub = this.appointmentModal.onOpen.subscribe(() => this.openAppointmentForm());
    this.prescriptionSub = this.prescriptionModal.onOpen.subscribe(() => this.openPrescriptionsForm());
    if (this.auth.isLoggedIn() && this.auth.hasRole([KEYCLOAK_ROLES.patient])) {
      this.notificationService.connectForPatient();
      this.notificationService.onToast = (msg) => this.showToast(msg);
    }
    if (this.auth.isLoggedIn() && this.auth.hasRole([KEYCLOAK_ROLES.medecin])) {
      this.resolveDoctorIdAndLoadAlerts();
      this.doctorAlertsInterval = setInterval(() => this.loadDoctorAlerts(), 60000);
    }
  }

  /** Résout idMedecin et charge les alertes non lues. */
  private async resolveDoctorIdAndLoadAlerts(): Promise<void> {
    try {
      const me = await firstValueFrom(this.http.get<Record<string, unknown>>('/api/medecins/me'));
      const id = (me?.['idMedecin'] ?? me?.['id']) as number | undefined;
      if (id != null && !isNaN(Number(id)) && Number(id) > 0) {
        this.doctorIdMedecin = Number(id);
        this.loadDoctorAlerts();
      }
    } catch {
      /* ignore */
    }
  }

  loadDoctorAlerts(): void {
    if (this.doctorIdMedecin <= 0) return;
    this.isLoadingDoctorAlerts = true;
    this.http.get<DoctorAlert[]>(`/api/notifications-medecin/medecin/${this.doctorIdMedecin}/non-lues`).subscribe({
      next: (list) => {
        this.doctorAlerts = list ?? [];
        this.doctorAlertsCount = this.doctorAlerts.length;
        this.isLoadingDoctorAlerts = false;
      },
      error: () => {
        this.doctorAlerts = [];
        this.doctorAlertsCount = 0;
        this.isLoadingDoctorAlerts = false;
      }
    });
  }

  markDoctorAlertRead(id: number): void {
    this.http.patch(`/api/notifications-medecin/${id}/lu`, {}).subscribe({
      next: () => this.loadDoctorAlerts()
    });
  }

  markAllDoctorAlertsRead(): void {
    if (this.doctorIdMedecin <= 0) return;
    this.http.patch(`/api/notifications-medecin/medecin/${this.doctorIdMedecin}/toutes-lues`, {}).subscribe({
      next: () => this.loadDoctorAlerts()
    });
  }

  formatAlertDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diff < 1) return "À l'instant";
    if (diff < 60) return `Il y a ${diff} min`;
    const h = Math.floor(diff / 60);
    if (h < 24) return `Il y a ${h}h`;
    return d.toLocaleDateString('fr-FR');
  }

  ngOnDestroy(): void {
    this.appointmentSub?.unsubscribe();
    this.prescriptionSub?.unsubscribe();
    this.notificationService.onToast = null;
    this.notificationService.disconnect();
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.doctorAlertsInterval) clearInterval(this.doctorAlertsInterval);
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    this.toastVisible = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
      this.toastTimer = null;
    }, 5000);
  }

  logout(): void {
    this.showProfile = false;
    this.notificationService.disconnect();
    this.auth.logout(window.location.origin + '/home').then(() => {
      this.router.navigate(['/login']);
    });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    this.showProfile = false;
    if (this.showNotifications) {
      if (this.auth.hasRole([KEYCLOAK_ROLES.medecin])) {
        this.loadDoctorAlerts();
      } else {
        this.notificationService.markAllAsRead();
      }
    }
  }

  toggleProfile() {
    this.showProfile = !this.showProfile;
    this.showNotifications = false;
  }

  /** Libellés alignés sur les rôles Keycloak : patient, medecin (pas Patient/Doctor). */
  getDisplayRoleLabels(): string[] {
    const labels: string[] = [];
    if (this.auth.hasRole([KEYCLOAK_ROLES.patient])) labels.push('patient');
    if (this.auth.hasRole([KEYCLOAK_ROLES.medecin])) labels.push('medecin');
    return labels;
  }

  openAppointmentForm() {
    this.showAppointmentForm = true;
    this.selectedSlot = null;
    this.appointmentManualDate = '';
    this.appointmentStatus = 'PENDING';
    this.loadSlots();
  }
  closeAppointmentForm() {
    this.showAppointmentForm = false;
  }
  loadSlots() {
    this.loadingSlots = true;
    setTimeout(() => {
      this.availableSlots = ['09:00', '10:00', '11:00', '14:00', '15:00'];
      this.loadingSlots = false;
    }, 800);
  }
  selectSlot(slot: string) {
    this.selectedSlot = this.selectedSlot === slot ? null : slot;
  }

  async openPrescriptionsForm() {
    this.showProfile = false;
    this.showPrescriptionsForm = false;
    this.showOrdonnancesModal = true;
    this.prescPatientUnknown = false;
    await this.resolvePatientId();
    this.loadOrdonnances();
  }

  /** Résout patientId et patientName (API /me, localStorage, JWT, liste patients) */
  private async resolvePatientId(): Promise<void> {
    this.patientName = localStorage.getItem('patientName') || '';

    // 1) /api/patients/me — endpoint dédié patient connecté (priorité)
    try {
      const me = await firstValueFrom(this.http.get<Record<string, unknown>>('/api/patients/me'));
      const pid = me?.['idPatient'] ?? me?.['id'] ?? me?.['patientId'];
      if (pid != null && !isNaN(Number(pid)) && Number(pid) > 0) {
        this.patientId = Number(pid);
        const fn = String(me?.['firstName'] ?? '').trim();
        const ln = String(me?.['lastName'] ?? '').trim();
        this.patientName = [fn, ln].filter(Boolean).join(' ').trim()
          || String(me?.['patientNom'] ?? me?.['nom'] ?? '').trim() || this.patientName;
        if (this.patientName) localStorage.setItem('patientName', this.patientName);
        localStorage.setItem('patientId', String(this.patientId));
        return;
      }
    } catch {
      /* continue */
    }

    // 2) localStorage
    const stored = localStorage.getItem('patientId');
    if (stored) {
      const n = parseInt(stored, 10);
      if (!isNaN(n) && n > 0) {
        this.patientId = n;
        return;
      }
    }

    const token = this.auth.getToken();
    if (!token) {
      this.patientId = 0;
      this.patientName = '';
      this.prescPatientUnknown = true;
      return;
    }

    // 3) JWT claims
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
      this.patientId = 0;
      this.patientName = '';
      this.prescPatientUnknown = true;
      return;
    }

    const pidDirect = (payload?.['idPatient'] ?? payload?.['patientId'] ?? payload?.['patient_id']) as number | string | null | undefined;
    if (pidDirect != null && !isNaN(Number(pidDirect)) && Number(pidDirect) > 0) {
      this.patientId = Number(pidDirect);
      const pfn = String(payload?.['firstName'] ?? '').trim();
      const pln = String(payload?.['lastName'] ?? '').trim();
      this.patientName = [pfn, pln].filter(Boolean).join(' ').trim() || this.patientName;
      if (this.patientName) localStorage.setItem('patientName', this.patientName);
      localStorage.setItem('patientId', String(this.patientId));
      return;
    }

    // 4) Liste /api/patients par username
    const username = (payload?.['preferred_username'] ?? payload?.['sub'] ?? payload?.['email']) as string | null | undefined;
    if (!username) {
      this.patientId = 0;
      this.patientName = '';
      this.prescPatientUnknown = true;
      return;
    }

    try {
      const patients = await firstValueFrom(this.http.get<unknown[]>('/api/patients'));
      const found = Array.isArray(patients)
        ? (patients.find((x: unknown) => {
            const o = x as Record<string, unknown>;
            return o?.['username'] === username || o?.['email'] === username || o?.['login'] === username;
          }) as Record<string, unknown> | undefined)
        : null;
      if (found) {
        const pid = found['idPatient'] ?? found['id'] ?? found['patientId'];
        if (pid != null && !isNaN(Number(pid))) {
          this.patientId = Number(pid);
          const fn = String(found['firstName'] ?? found['prenom'] ?? '').trim();
          const ln = String(found['lastName'] ?? found['nom'] ?? '').trim();
          this.patientName = [fn, ln].filter(Boolean).join(' ').trim()
            || String(found['patientNom'] ?? found['username'] ?? '').trim();
          if (this.patientName) localStorage.setItem('patientName', this.patientName);
          localStorage.setItem('patientId', String(this.patientId));
          return;
        }
      }
    } catch {
      /* ignore */
    }

    this.patientId = 0;
    this.patientName = '';
    this.prescPatientUnknown = true;
  }
  closePrescriptionsForm() {
    this.showPrescriptionsForm = false;
  }
  loadPrescriptions() {
    this.loadingPrescriptions = true;
    this.prescriptionService.getAll().subscribe({
      next: (list) => {
        this.prescriptionsList = (list ?? []).map(p => ({
          id: p.id ?? 0,
          label: `Patient ${p.patientId} – ${p.notes || 'Prescription'}`,
          date: p.prescriptionDate || ''
        }));
        this.loadingPrescriptions = false;
      },
      error: () => {
        this.prescriptionsList = [];
        this.loadingPrescriptions = false;
      }
    });
  }
  loadOrdonnances() {
    this.isPrescLoading = true;
    const pid = this.patientId || parseInt(localStorage.getItem('patientId') || '0', 10);
    if (pid > 0) {
      this.prescriptionService.getActiveByPatient(pid).subscribe({
        next: (data) => {
          const list = (data || []).filter(p => getPrescriptionPatientId(p) === pid);
          this.prescriptions = list.sort((a, b) =>
            new Date(b.prescriptionDate).getTime() - new Date(a.prescriptionDate).getTime()
          );
          this.isPrescLoading = false;
        },
        error: () => {
          this.prescriptions = [];
          this.isPrescLoading = false;
        }
      });
    } else {
      this.prescriptions = [];
      this.isPrescLoading = false;
    }
  }
  closeOrdonnances() {
    this.showOrdonnancesModal = false;
  }

  /** Vérifie que l'ordonnance appartient au patient connecté */
  isPrescriptionForCurrentPatient(p: PrescriptionDTO): boolean {
    const pid = this.patientId || parseInt(localStorage.getItem('patientId') || '0', 10);
    return pid > 0 && getPrescriptionPatientId(p) === pid;
  }

  /** Prescriptions filtrées pour le patient connecté uniquement */
  get prescriptionsForCurrentPatient(): PrescriptionDTO[] {
    const pid = this.patientId || parseInt(localStorage.getItem('patientId') || '0', 10);
    if (pid <= 0) return [];
    return this.prescriptions.filter(p => getPrescriptionPatientId(p) === pid);
  }

  /** ID patient pour l’ordonnance affichée (patientId ou patient_id). */
  get detailPrescriptionPatientId(): number {
    return this.selectedPrescription ? getPrescriptionPatientId(this.selectedPrescription) : 0;
  }

  /** Notes prescription (plusieurs clés possibles selon l’API). */
  prescNotes(p: PrescriptionDTO | null | undefined): string {
    if (!p) return '';
    const o = p as unknown as Record<string, unknown>;
    const v = o['notes'] ?? o['clinicalNotes'] ?? o['note'] ?? o['clinical_note'];
    return v != null ? String(v).trim() : '';
  }

  /** Lit un champ item prescription (camelCase ou snake_case). */
  ordItemPick(item: unknown, ...keys: string[]): string {
    if (item == null || typeof item !== 'object') return '';
    const o = item as Record<string, unknown>;
    for (const k of keys) {
      const v = o[k];
      if (v != null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
  }

  /** Titre ligne médicament : nom + dosage (comme sur la maquette). */
  ordItemTitle(item: unknown, index: number): string {
    const name = this.ordItemPick(item, 'medicationName', 'medication_name', 'name');
    const dose = this.ordItemPick(item, 'medicationDosage', 'dosage', 'dose');
    const unit = this.ordItemPick(item, 'medicationUnit', 'unit');
    const dosePart = [dose, unit].filter(Boolean).join(' ').trim();
    if (name && dosePart) return `${name} ${dosePart}`;
    if (name) return name;
    if (dosePart) return dosePart;
    return `Médicament ${index + 1}`;
  }

  ordItemFrequency(item: unknown): string {
    const f = this.ordItemPick(item, 'frequency');
    if (f) return f;
    const o = item as Record<string, unknown>;
    const n = o?.['frequencyPerDay'];
    if (typeof n === 'number' && n > 0) return `${n}x/jour`;
    if (n != null && !isNaN(Number(n)) && Number(n) > 0) return `${Number(n)}x/jour`;
    return '';
  }

  ordItemPosology(item: unknown): string {
    return this.ordItemPick(item, 'dosageInstructions', 'dosage_instructions', 'posology', 'posologie');
  }

  ordItemRoute(item: unknown): string {
    return this.ordItemPick(item, 'administrationRoute', 'administration_route', 'route', 'voie');
  }

  ordItemDuration(item: unknown): string {
    const raw = this.ordItemPick(item, 'duration');
    if (!raw) return '';
    const n = Number(raw);
    if (!isNaN(n) && String(n) === String(raw).replace(/\s/g, '')) return `${n} jour(s)`;
    return raw.includes('jour') ? raw : `${raw} jour(s)`;
  }

  ordItemStart(item: unknown): string {
    return this.ordItemPick(item, 'startDate', 'start_date');
  }

  ordItemEnd(item: unknown): string {
    return this.ordItemPick(item, 'endDate', 'end_date');
  }

  ordItemCategory(item: unknown): string {
    return this.ordItemPick(item, 'medicationCategory', 'category', 'medication_category');
  }

  selectOrdonnance(presc: PrescriptionDTO) {
    this.showOrdonnancesModal = false;
    if (presc.id && (!presc.prescriptionItems || presc.prescriptionItems.length === 0)) {
      this.prescriptionService.getById(presc.id).subscribe({
        next: (full) => {
          this.selectedPrescription = full;
          this.showPrescriptionDetail = true;
        },
        error: () => {
          this.selectedPrescription = presc;
          this.showPrescriptionDetail = true;
        }
      });
    } else {
      this.selectedPrescription = presc;
      this.showPrescriptionDetail = true;
    }
  }
  openPrescriptionDetail(presc: PrescriptionDTO | unknown) {
    const p = presc as PrescriptionDTO;
    const pid = getPrescriptionPatientId(p);
    if (p && (pid > 0 || p.prescriptionDate != null)) {
      this.selectedPrescription = p;
      this.showOrdonnancesModal = false;
      this.showPrescriptionDetail = true;
    }
  }
  closePrescriptionDetail() {
    this.showPrescriptionDetail = false;
    this.selectedPrescription = null;
  }
  printPrescription(presc?: PrescriptionDTO) {
    const p = presc ?? this.selectedPrescription;
    if (!p) return;
    const pid = getPrescriptionPatientId(p);
    const itemsHtml = (p.prescriptionItems ?? []).map((item, i) => {
      const title = this.ordItemTitle(item, i);
      const freq = this.ordItemFrequency(item);
      const route = this.ordItemRoute(item);
      const dur = this.ordItemDuration(item);
      const pos = this.ordItemPosology(item);
      const sd = this.ordItemStart(item);
      const ed = this.ordItemEnd(item);
      const fmt = (s: string) => (s ? new Date(s).toLocaleDateString('fr-FR') : '');
      return `
      <div class="med-item"><div class="med-num">${i + 1}</div><div class="med-body">
        <span class="med-name">${title}</span>
        ${freq ? `<span><b>Fréquence :</b> ${freq}</span>` : ''}
        ${route ? `<span><b>Voie :</b> ${route}</span>` : ''}
        ${dur ? `<span><b>Durée :</b> ${dur}</span>` : ''}
        ${pos ? `<span><b>Posologie :</b> ${pos}</span>` : ''}
        ${sd ? `<span><b>Début :</b> ${fmt(sd)}</span>` : ''}
        ${ed ? `<span><b>Fin :</b> ${fmt(ed)}</span>` : ''}
      </div></div>`;
    }).join('');
    const notes = this.prescNotes(p);
    const win = window.open('', '_blank', 'width=860,height=1000');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Ordonnance #${p.id}</title>
<style>*{margin:0;padding:0}body{font-family:Segoe UI,sans-serif;padding:24px;color:#1f2937}
.med-item{display:flex;gap:12px;margin-bottom:16px;padding:12px;border:1px solid #e5e7eb;border-radius:8px}
.med-num{width:28px;height:28px;background:#1e3a8a;color:white;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px}
.med-name{font-weight:700;font-size:15px}.med-body span{margin-right:12px;font-size:13px;color:#4b5563}</style>
<body><h1>KidneyCare - Ordonnance N° ${p.id}</h1>
<p>Patient #${pid} · ${new Date(p.prescriptionDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
${notes ? `<div style="background:#fffbeb;padding:12px;margin:16px 0;border-radius:8px"><b>Note clinique :</b> ${notes}</div>` : ''}
<div style="margin-top:20px">${itemsHtml}</div></body></html>`);
    win.document.close();
    setTimeout(() => { win!.print(); win!.close(); }, 500);
  }
  downloadPrescriptionPDF(presc?: PrescriptionDTO) {
    const p = presc ?? this.selectedPrescription;
    if (!p) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210, margin = 20;
    let y = 20;
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text('KidneyCare', margin, 12);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text('Centre de Néphrologie Pédiatrique · Tunis · +216 70 000 000', margin, 20);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('ORDONNANCE', pageW - margin, 12, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(`N° ${p.id ?? '—'}`, pageW - margin, 18, { align: 'right' });
    doc.text(new Date(p.prescriptionDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }), pageW - margin, 24, { align: 'right' });
    y = 34;
    doc.setDrawColor(59, 130, 246); doc.setLineWidth(1.2);
    doc.line(margin, y, pageW - margin, y); y += 8;
    doc.setTextColor(30, 41, 59); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('PATIENT', margin, y); doc.text('DATE', 90, y); doc.text('MÉDICAMENTS', 140, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); y += 5;
    doc.text(`#${getPrescriptionPatientId(p)}`, margin, y);
    doc.text(new Date(p.prescriptionDate).toLocaleDateString('fr-FR'), 90, y);
    doc.text(`${p.prescriptionItems?.length ?? 0}`, 140, y); y += 10;
    const pdfNotes = this.prescNotes(p);
    if (pdfNotes) {
      doc.setFillColor(255, 251, 235); doc.setDrawColor(245, 158, 11);
      doc.roundedRect(margin, y, pageW - margin * 2, 14, 2, 2, 'FD');
      doc.setTextColor(120, 53, 15);
      doc.setFont('helvetica', 'bolditalic'); doc.setFontSize(9);
      doc.text('Note clinique :', margin + 4, y + 5);
      doc.setFont('helvetica', 'italic');
      doc.text(pdfNotes, margin + 4, y + 11, { maxWidth: pageW - margin * 2 - 8 });
      y += 20;
    }
    doc.setTextColor(30, 58, 138);
    doc.setFont('times', 'bolditalic'); doc.setFontSize(18);
    doc.text('Rp', margin, y + 6);
    doc.setDrawColor(30, 58, 138); doc.setLineWidth(0.4);
    doc.line(margin + 12, y + 3, pageW - margin, y + 3); y += 14;
    const items = p.prescriptionItems ?? [];
    items.forEach((item, i) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFillColor(30, 58, 138);
      doc.rect(margin, y - 1, 7, 9, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.text(`${i + 1}`, margin + 3.5, y + 5.5, { align: 'center' });
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
      doc.text(this.ordItemTitle(item, i), margin + 10, y + 6);
      y += 11;
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      const details: string[] = [];
      const freq = this.ordItemFrequency(item);
      const route = this.ordItemRoute(item);
      const dur = this.ordItemDuration(item);
      const pos = this.ordItemPosology(item);
      const sd = this.ordItemStart(item);
      const ed = this.ordItemEnd(item);
      if (freq) details.push(`Fréquence : ${freq}`);
      if (route) details.push(`Voie : ${route}`);
      if (dur) details.push(`Durée : ${dur}`);
      if (pos) details.push(`Posologie : ${pos}`);
      if (sd) details.push(`Début : ${new Date(sd).toLocaleDateString('fr-FR')}`);
      if (ed) details.push(`Fin : ${new Date(ed).toLocaleDateString('fr-FR')}`);
      if (details.length) { doc.text(details.join('   ·   '), margin + 10, y, { maxWidth: pageW - margin * 2 - 10 }); y += 6; }
      doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
      doc.line(margin, y, pageW - margin, y); y += 6;
    });
    y = Math.max(y + 10, 240);
    doc.setDrawColor(203, 213, 225); doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y); y += 8;
    doc.setDrawColor(51, 65, 85); doc.setLineWidth(0.5);
    doc.line(margin, y + 14, margin + 50, y + 14);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    doc.text('Signature & Cachet du médecin', margin, y + 19);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138); doc.setFontSize(10);
    doc.text('KidneyCare · Portail patient', pageW - margin, y + 8, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); doc.setFontSize(8);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageW - margin, y + 14, { align: 'right' });
    doc.text('Valable 3 mois à compter de la prescription', pageW - margin, y + 19, { align: 'right' });
    const dateStr2 = new Date(p.prescriptionDate).toLocaleDateString('fr-FR').replace(/\//g, '-');
    doc.save(`Ordonnance_${p.id}_${dateStr2}.pdf`);
  }
  openEmergencyForm() {
    this.showEmergencyForm = true;
  }
  closeEmergencyForm() {
    this.showEmergencyForm = false;
  }
  openMedicalReportForm() {
    this.showMedicalReportForm = true;
  }
  closeMedicalReportForm() {
    this.showMedicalReportForm = false;
  }
  openLabResultForm() {
    this.showLabResultForm = true;
  }
  closeLabResultForm() {
    this.showLabResultForm = false;
  }
  openTreatmentForm() {
    this.showTreatmentForm = true;
  }
  closeTreatmentForm() {
    this.showTreatmentForm = false;
  }

  onSubmitAppointment(form: NgForm) {
    if (form.valid && (this.selectedSlot || this.appointmentManualDate)) {
      const payload = {
        patientId: this.appointmentPatientId,
        slot: this.selectedSlot,
        manualDate: this.appointmentManualDate,
        status: this.appointmentStatus,
      };
      console.log('Appointment', payload);
      this.notification.success('Appointment request sent.');
      this.closeAppointmentForm();
      this.selectedSlot = null;
      this.appointmentManualDate = '';
      this.appointmentStatus = 'PENDING';
    }
  }
  onSubmitEmergency(form: NgForm) {
    if (form.valid) {
      console.log('Emergency', form.value);
      this.notification.success('Emergency recorded. We will contact you.');
      this.closeEmergencyForm();
      form.reset();
    }
  }
  onSubmitMedicalReport(form: NgForm) {
    if (form.valid) {
      console.log('Medical Report', form.value);
      this.notification.success('Medical report requested.');
      this.closeMedicalReportForm();
      form.reset();
    }
  }
  onSubmitLabResult(form: NgForm) {
    if (form.valid) {
      console.log('Lab Result', form.value);
      this.notification.success('Lab results requested.');
      this.closeLabResultForm();
      form.reset();
    }
  }
  onSubmitTreatment(form: NgForm) {
    if (form.valid) {
      console.log('Treatment', form.value);
      this.notification.success('Treatment recorded.');
      this.closeTreatmentForm();
      form.reset();
    }
  }

  /** Navigue vers la home puis fait défiler jusqu'à la section \"Medical records\". */
  goToMedicalRecords() {
    this.router.navigate(['/home']).then(() => {
      const el = document.getElementById('medical-records');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}
