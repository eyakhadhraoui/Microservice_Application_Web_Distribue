import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { KEYCLOAK_ROLES } from '../auth/keycloak-roles';
import { DossierService, DossierMedical } from '../services/dossier';
import { SuiviService, Suivi } from '../services/suivi';
import { ImageMedicaleService, ImageMedicale } from '../services/image-medicale';
import { TestLaboratoireService, TestLaboratoire } from '../services/test-laboratoire';
import { ResultatLaboratoireService, ResultatLaboratoire, formatValeurResultat } from '../services/resultat-laboratoire';
import { RapportBiService, RapportBi } from '../services/rapport-bi';
import { AlerteService, Alerte } from '../services/alerte';
import { MessageService, Message, TypeExpediteur } from '../services/message.service';
import { NephroChatbotService, ChatMessage } from '../services/nephro-chatbot.service';
import { NotificationService } from '../services/notification.service';
import { ConfirmService } from '../services/confirm.service';
import { AppointmentModalService } from '../services/appointment-modal.service';
import { PrescriptionModalService } from '../services/prescription-modal.service';
import { PrescriptionService, getPrescriptionPatientId } from '../services/prescription.service';
import { NotificationWebSocketService } from '../services/notification-websocket.service';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import jsPDF from 'jspdf';

/* ── Prescription interfaces ─────────────────────────── */
export interface PrescriptionItemDTO {
  id?:                   number;
  medicationId?:         number;
  medicationName?:       string;
  dosage?:               string;
  category?:             string;
  dosageInstructions?:   string;
  frequency?:            string;
  administrationRoute?:  string;
  duration?:             number | string;
  startDate?:            string;
  endDate?:              string;
  isPriority?:           boolean;
  isImmunosuppressor?:   boolean;
  specialInstructions?:  string;
  schedules?:            any[];
}

export interface PrescriptionDTO {
  id?:                number;
  patientId:          number;
  prescriptionDate:   string;
  notes?:             string;
  prescriptionItems?: PrescriptionItemDTO[];
}

/* ── Timeline interfaces ─────────────────────────────── */
export type TimelineEventType  = 'suivi' | 'hospitalisation' | 'image' | 'bilan';
export type TimelineEventState = 'improvement' | 'stagnation' | 'deterioration';

export interface TimelineEvent {
  type:    TimelineEventType;
  date:    string;
  label:   string;
  state:   TimelineEventState;
  payload: { id?: number; [key: string]: unknown };
  raw?:    Suivi | ImageMedicale | ResultatLaboratoire;
}

@Component({
  selector:    'app-home',
  standalone:  false,
  templateUrl: './home.html',
  styleUrls:   ['./home.css']
})
export class Home implements OnInit, OnDestroy {

  private readonly apiUrl = '/api';
  private notifSub?: Subscription;

  /* ── Auth / patient ──────────────────────────────── */
  loadingUser = true;
  patientId   = 0;
  today       = new Date();

  /* ── Dossiers ────────────────────────────────────── */
  dossiers: DossierMedical[] = [];
  loading  = false;
  error    = '';

  /* ── Données par dossier ─────────────────────────── */
  dossierSuivis:    { [id: number]: Suivi[]               } = {};
  loadingSuivis:    { [id: number]: boolean               } = {};
  dossierImages:    { [id: number]: ImageMedicale[]        } = {};
  dossierResultats: { [id: number]: ResultatLaboratoire[] } = {};
  loadingResultats: { [id: number]: boolean               } = {};
  expandedPatients: { [id: number]: boolean               } = {};

  /* ── Timeline ────────────────────────────────────── */
  timelineFilters:  { [id: number]: { suivi: boolean; image: boolean; bilan: boolean } } = {};
  showAddEventModal = false;
  addEventDate      = '';
  addEventType: 'suivi' | 'hospitalisation' | 'image' | 'bilan' = 'suivi';
  addEventDossier:  DossierMedical | null = null;
  showSuiviFormPopup = false;
  suiviFormDossier:  DossierMedical | null = null;
  suiviFormDate      = '';
  suiviFormNotes     = '';
  suiviFormObjectif  = '';
  suiviFormResultat  = 'STABLE';
  suiviSubmitting    = false;
  suiviFormError     = '';
  dragSourceDate     = '';
  timelineDragOver:  { [id: number]: boolean } = {};

  /* ── Alertes ─────────────────────────────────────── */
  alertes:        Alerte[] = [];
  loadingAlertes  = false;
  alerteJours     = 90;

  /* ── Messagerie ──────────────────────────────────── */
  messagesByDossierId:        { [id: number]: Message[] } = {};
  newMessageTextByDossier:    { [id: number]: string    } = {};
  loadingMessagesByDossier:   { [id: number]: boolean   } = {};
  sendingMessageByDossier:    { [id: number]: boolean   } = {};

  /* ── Tests labo ──────────────────────────────────── */
  testsCatalog:              TestLaboratoire[] = [];
  loadingTestsCatalog        = false;
  showResultatFormPopup      = false;
  selectedDossierForResultat: DossierMedical | null = null;
  resultatFormError          = '';
  resultatSubmitting         = false;
  selectedIdTestInForm:       number | null = null;
  resultatDefaultDate        = '';

  valeurSuggestions = ['Normal','Élevé','Bas','À surveiller','Négatif','Positif','Dans la norme','Anormal','14.2 g/L','120 mg/L','0.5 mmol/L','Hors norme','À contrôler'];
  etatChoices       = ['Normal','À surveiller','Élevé','Bas','Dans la norme','Anormal','Hors norme','À contrôler','Stable','Amélioration','Détérioration'];

  /* ── Bilans / Rapports ───────────────────────────── */
  showAffichagePopup:          boolean                    = false;
  selectedResultatAffichage:   ResultatLaboratoire | null = null;
  showBilanPopup:              boolean                    = false;
  selectedBilan:               ResultatLaboratoire | null = null;
  selectedDossierForBilan:     DossierMedical      | null = null;
  rapportsForBilan:            RapportBi[]                = [];
  rapportsByResultatId:        { [id: number]: RapportBi[] } = {};
  loadingRapports              = false;

  /* ══════════════════════════════════════════════════
     ✅ PRESCRIPTIONS — intégrées depuis home-presc.ts
  ══════════════════════════════════════════════════ */
  prescriptions:          PrescriptionDTO[] = [];
  isPrescLoading          = false;
  showDocumentsModal      = false;
  selectedFolder:         string | null     = null;
  showOrdonnancesModal    = false;
  showPrescriptionDetail  = false;
  selectedPrescription:   PrescriptionDTO | null = null;

  /* ── Formulaires modaux ──────────────────────────── */
  showAppointmentForm   = false;
  showEmergencyForm     = false;
  showMedicalReportForm = false;
  showLabResultForm     = false;
  showTreatmentForm     = false;

  /* ── Notifications ───────────────────────────────── */
  showNotifications    = false;
  unreadNotifications  = 3;
  notifications = [
    { icon: '💊', title: 'Medication Reminder',  time: '10 min ago'  },
    { icon: '📅', title: 'Appointment Tomorrow', time: '2 hours ago' },
    { icon: '🧪', title: 'Lab Results Ready',    time: '1 day ago'   }
  ];
  showProfile = false;

  /* ── Chatbot ─────────────────────────────────────── */
  chatOpen      = false;
  chatMessages:  ChatMessage[] = [];
  chatUserInput  = '';

  constructor(
    private http:               HttpClient,
    private router:             Router,
    private cdr:                ChangeDetectorRef,
    public  auth:               AuthService,
    private dossierService:     DossierService,
    private suiviService:       SuiviService,
    private imageMedicaleService:       ImageMedicaleService,
    private testLaboratoireService:     TestLaboratoireService,
    private resultatLaboratoireService: ResultatLaboratoireService,
    private rapportBiService:   RapportBiService,
    private alerteService:      AlerteService,
    private messageService:     MessageService,
    private nephroChatbot:      NephroChatbotService,
    private notification:       NotificationService,
    private confirmService:     ConfirmService,
    private appointmentModal:   AppointmentModalService,
    private prescriptionModal:  PrescriptionModalService,
    private prescriptionService: PrescriptionService,
    private notificationWs:     NotificationWebSocketService,
  ) {}

  ngOnInit(): void {
    this.loadDossiers();
    this.loadAlertes();
    this.initChatbot();
    this.subscribeToImageNotifications();

    this.testLaboratoireService.getAll().subscribe({
      next:  list => { this.testsCatalog = list || []; this.cdr.detectChanges(); },
      error: ()   => { this.testsCatalog = []; }
    });

    this.resolvePatientIdAndLoadPrescriptions();
  }

  /** Résout patientId (et patientName) puis charge les prescriptions */
  private async resolvePatientIdAndLoadPrescriptions(): Promise<void> {
    // 1) /api/patients/me — endpoint dédié patient connecté
    try {
      const me = await firstValueFrom(this.http.get<Record<string, unknown>>('/api/patients/me'));
      const pid = me?.['idPatient'] ?? me?.['id'] ?? me?.['patientId'];
      if (pid != null && !isNaN(Number(pid)) && Number(pid) > 0) {
        this.patientId = Number(pid);
        const fn = String(me?.['firstName'] ?? '').trim();
        const ln = String(me?.['lastName'] ?? '').trim();
        const pn = [fn, ln].filter(Boolean).join(' ').trim() || String(me?.['patientNom'] ?? me?.['nom'] ?? '').trim();
        if (pn) localStorage.setItem('patientName', pn);
        localStorage.setItem('patientId', String(this.patientId));
        this.loadPrescriptions();
        this.cdr.detectChanges();
        return;
      }
    } catch {
      /* continue */
    }

    const stored = localStorage.getItem('patientId');
    if (stored) {
      const n = parseInt(stored, 10);
      if (!isNaN(n) && n > 0) {
        this.patientId = n;
        this.loadPrescriptions();
        return;
      }
    }

    const token = this.auth.getToken();
    if (!token) {
      this.cdr.detectChanges();
      return;
    }

    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
      this.cdr.detectChanges();
      return;
    }

    const pidDirect = (payload?.['idPatient'] ?? payload?.['patientId'] ?? payload?.['patient_id']) as number | string | null | undefined;
    if (pidDirect != null && !isNaN(Number(pidDirect)) && Number(pidDirect) > 0) {
      this.patientId = Number(pidDirect);
      localStorage.setItem('patientId', String(this.patientId));
      this.loadPrescriptions();
      this.cdr.detectChanges();
      return;
    }

    const username = (payload?.['preferred_username'] ?? payload?.['sub'] ?? payload?.['email']) as string | null | undefined;
    if (!username) {
      this.cdr.detectChanges();
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
          const pn = [fn, ln].filter(Boolean).join(' ').trim() || String(found['patientNom'] ?? found['username'] ?? '').trim();
          if (pn) localStorage.setItem('patientName', pn);
          localStorage.setItem('patientId', String(this.patientId));
          this.loadPrescriptions();
        }
      }
    } catch {
      /* ignore */
    }
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.notifSub?.unsubscribe();
  }

  /** S'abonne aux notifications WebSocket (IMAGE_MEDICALE) pour rafraîchir les images. */
  private subscribeToImageNotifications(): void {
    this.notifSub = this.notificationWs.notifications$.subscribe((items) => {
      const last = items[items.length - 1];
      if (last?.type === 'IMAGE_MEDICALE' && last.idDossierMedical != null) {
        this.loadImagesByDossier(last.idDossierMedical);
      }
    });
  }

  /* ══════════════════════════════════════════════════
     PRESCRIPTIONS
  ══════════════════════════════════════════════════ */

  /** Charge les prescriptions actives du patient (PrescriptionService → port 8086) */
  loadPrescriptions(): void {
    if (!this.patientId) return;
    this.isPrescLoading = true;
    this.prescriptionService.getActiveByPatient(this.patientId).subscribe({
      next: (data) => {
        const list = (data || []).filter(p => getPrescriptionPatientId(p) === this.patientId);
        this.prescriptions = list.sort((a, b) =>
          new Date(b.prescriptionDate).getTime() -
          new Date(a.prescriptionDate).getTime()
        );
        this.isPrescLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.prescriptions = [];
        this.isPrescLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /** Ouvre la modal Prescriptions (navbar) */
  openPrescriptionsModal(): void {
    this.prescriptionModal.open();
  }

  /* ── Modaux Documents ────────────────────────────── */
  openDocuments(): void {
    this.selectedFolder     = null;
    this.showDocumentsModal = true;
  }

  closeDocuments(): void {
    this.showDocumentsModal = false;
    this.selectedFolder     = null;
  }

  openFolder(folder: string | unknown): void {
    const f = typeof folder === 'string' ? folder : '';
    this.selectedFolder     = f;
    this.showDocumentsModal = true;
    if (f === 'ordonnances' && this.prescriptions.length === 0) {
      this.loadPrescriptions();
    }
  }

  openOrdonnances(): void {
    this.showOrdonnancesModal = true;
    this.showDocumentsModal   = false;
    if (this.prescriptions.length === 0) this.loadPrescriptions();
  }

  closeOrdonnances(): void {
    this.showOrdonnancesModal = false;
  }

  selectOrdonnance(prescription: PrescriptionDTO): void {
    this.selectedPrescription   = prescription;
    this.showOrdonnancesModal   = false;
    this.showDocumentsModal     = false;
    this.selectedFolder         = null;
    this.showPrescriptionDetail = true;
  }

  openPrescriptionDetail(prescription: PrescriptionDTO | unknown): void {
    const presc = prescription as PrescriptionDTO;
    if (presc && (presc.patientId != null || presc.prescriptionDate != null)) {
      this.selectedPrescription   = presc;
      this.showDocumentsModal     = false;
      this.showOrdonnancesModal   = false;
      this.selectedFolder         = null;
      this.showPrescriptionDetail = true;
    }
  }

  closePrescriptionDetail(): void {
    this.showPrescriptionDetail = false;
    this.selectedPrescription   = null;
  }

  /* ── Print ordonnance ────────────────────────────── */
  printPrescription(presc?: PrescriptionDTO): void {
    if (!presc) return;
    const dateStr   = new Date(presc.prescriptionDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const dateShort = new Date(presc.prescriptionDate).toLocaleDateString('fr-FR');

    const itemsHtml = (presc.prescriptionItems ?? []).map((item, i) => `
      <div class="med-item">
        <div class="med-num">${i + 1}</div>
        <div class="med-body">
          <div class="med-top">
            <span class="med-name">${item.medicationName ?? `Médicament ${i + 1}`}</span>
            ${item.dosage             ? `<span class="badge-dose">${item.dosage}</span>`   : ''}
            ${item.isPriority         ? `<span class="badge-prio">★ Prioritaire</span>`   : ''}
            ${item.isImmunosuppressor ? `<span class="badge-immuno">Immunosupp.</span>`   : ''}
          </div>
          ${item.category ? `<div class="med-cat">${item.category}</div>` : ''}
          <div class="med-details">
            ${item.frequency           ? `<span><b>Fréquence :</b> ${item.frequency}</span>`                                                   : ''}
            ${item.administrationRoute ? `<span><b>Voie :</b> ${item.administrationRoute}</span>`                                              : ''}
            ${item.duration            ? `<span><b>Durée :</b> ${item.duration} jour(s)</span>`                                                : ''}
            ${item.dosageInstructions  ? `<span><b>Posologie :</b> ${item.dosageInstructions}</span>`                                          : ''}
            ${item.startDate           ? `<span><b>Début :</b> ${new Date(item.startDate).toLocaleDateString('fr-FR')}</span>`                 : ''}
            ${item.endDate             ? `<span><b>Fin :</b> ${new Date(item.endDate).toLocaleDateString('fr-FR')}</span>`                     : ''}
          </div>
          ${item.specialInstructions ? `<div class="med-special">${item.specialInstructions}</div>` : ''}
        </div>
      </div>
    `).join('');

    const noteHtml = presc.notes
      ? `<div class="note-box">
           <div class="note-label">NOTE CLINIQUE</div>
           <div class="note-text">${presc.notes}</div>
         </div>`
      : '';

    const win = window.open('', '_blank', 'width=860,height=1000');
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>Ordonnance #${presc.id}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box }
  body { font-family:'Segoe UI',Arial,sans-serif; background:white; color:#1f2937 }
  .header { background:#1e3a8a; padding:22px 36px; display:flex; justify-content:space-between; align-items:flex-start }
  .clinic-name { color:white; font-size:22px; font-weight:900; margin-bottom:4px }
  .clinic-sub { color:rgba(255,255,255,0.75); font-size:11px }
  .doc-meta { text-align:right }
  .doc-title { color:rgba(255,255,255,0.7); font-size:9px; letter-spacing:3px; text-transform:uppercase; margin-bottom:3px }
  .doc-num { color:white; font-size:20px; font-weight:900; font-family:'Courier New',monospace }
  .doc-date { color:rgba(255,255,255,0.7); font-size:11px; margin-top:3px }
  .rule { height:3px; background:linear-gradient(90deg,#1e3a8a,#3b82f6,#bfdbfe) }
  .body { padding:28px 36px }
  .info-row { display:flex; border:1.5px solid #e2e8f0; border-radius:8px; overflow:hidden; margin-bottom:22px }
  .info-cell { flex:1; padding:10px 16px; border-right:1px solid #e2e8f0; display:flex; flex-direction:column; gap:3px }
  .info-cell:last-child { border-right:none }
  .info-lbl { font-size:9px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px }
  .info-val { font-size:14px; font-weight:700; color:#1e293b }
  .note-box { background:#fffbeb; border:1px solid #fde68a; border-left:4px solid #f59e0b; border-radius:0 8px 8px 0; padding:10px 14px; margin-bottom:20px }
  .note-label { font-size:9px; font-weight:800; color:#92400e; text-transform:uppercase; margin-bottom:3px }
  .note-text { font-size:13px; color:#78350f; font-style:italic }
  .rp-row { display:flex; align-items:center; gap:12px; margin-bottom:16px }
  .rp-sym { font-size:28px; font-weight:900; color:#1e3a8a; font-family:Georgia,serif; font-style:italic }
  .rp-line { flex:1; height:1.5px; background:#1e3a8a; opacity:0.2 }
  .med-item { display:flex; border:1.5px solid #e2e8f0; border-radius:9px; overflow:hidden; margin-bottom:10px }
  .med-num { width:38px; background:#1e3a8a; color:white; display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:900; flex-shrink:0 }
  .med-body { padding:12px 15px; flex:1 }
  .med-top { display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:4px }
  .med-name { font-size:15px; font-weight:800; color:#0f172a }
  .badge-dose { background:#dbeafe; color:#1e40af; font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px }
  .badge-prio { background:#fef3c7; color:#92400e; font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px }
  .badge-immuno { background:#fce7f3; color:#9d174d; font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px }
  .med-cat { font-size:11px; color:#64748b; font-style:italic; margin-bottom:7px }
  .med-details { display:flex; flex-wrap:wrap; gap:6px 16px; font-size:12px; color:#475569 }
  .med-details b { color:#334155 }
  .med-special { margin-top:7px; font-size:12px; color:#1e40af; background:#eff6ff; border-left:3px solid #3b82f6; padding:5px 10px; border-radius:0 6px 6px 0 }
  .footer-rule { border:none; border-top:1.5px dashed #cbd5e1; margin:28px 0 16px }
  .footer-row { display:flex; justify-content:space-between; align-items:flex-end }
  .sig-line { width:160px; height:1px; background:#334155; margin-bottom:5px }
  .sig-label { font-size:11px; color:#64748b }
  .footer-right { text-align:right }
  .footer-brand { font-size:12px; font-weight:800; color:#1e3a8a }
  .footer-gen { font-size:10px; color:#94a3b8; margin-top:2px }
  .footer-valid { font-size:10px; color:#94a3b8; font-style:italic }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact } }
</style></head><body>
<div class="header">
  <div>
    <div class="clinic-name">KidneyCare</div>
    <div class="clinic-sub">Centre de Néphrologie Pédiatrique · Tunis · +216 70 000 000</div>
  </div>
  <div class="doc-meta">
    <div class="doc-title">Ordonnance</div>
    <div class="doc-num">N° ${presc.id}</div>
    <div class="doc-date">${dateStr}</div>
  </div>
</div>
<div class="rule"></div>
<div class="body">
  <div class="info-row">
    <div class="info-cell"><span class="info-lbl">Patient</span><span class="info-val">#${presc.patientId}</span></div>
    <div class="info-cell"><span class="info-lbl">Date</span><span class="info-val">${dateShort}</span></div>
    <div class="info-cell"><span class="info-lbl">Médicaments</span><span class="info-val">${presc.prescriptionItems?.length ?? 0}</span></div>
  </div>
  ${noteHtml}
  <div class="rp-row"><span class="rp-sym">Rp</span><div class="rp-line"></div></div>
  ${itemsHtml || '<p style="color:#94a3b8;font-style:italic">Aucun médicament prescrit.</p>'}
  <hr class="footer-rule">
  <div class="footer-row">
    <div><div class="sig-line"></div><div class="sig-label">Signature &amp; Cachet du médecin</div></div>
    <div class="footer-right">
      <div class="footer-brand">KidneyCare · Parent Portal</div>
      <div class="footer-gen">Généré le ${new Date().toLocaleDateString('fr-FR')}</div>
      <div class="footer-valid">Valable 3 mois à compter de la prescription</div>
    </div>
  </div>
</div>
</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 500);
  }

  /* ── PDF download ────────────────────────────────── */
  downloadPrescriptionPDF(presc?: PrescriptionDTO): void {
    if (!presc) return;
    const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
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
    doc.text(`N° ${presc.id ?? '—'}`, pageW - margin, 18, { align: 'right' });
    doc.text(
      new Date(presc.prescriptionDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
      pageW - margin, 24, { align: 'right' }
    );

    y = 34;
    doc.setDrawColor(59, 130, 246); doc.setLineWidth(1.2);
    doc.line(margin, y, pageW - margin, y); y += 8;
    doc.setTextColor(30, 41, 59); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('PATIENT', margin, y); doc.text('DATE', 90, y); doc.text('MÉDICAMENTS', 140, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); y += 5;
    doc.text(`#${presc.patientId}`, margin, y);
    doc.text(new Date(presc.prescriptionDate).toLocaleDateString('fr-FR'), 90, y);
    doc.text(`${presc.prescriptionItems?.length ?? 0}`, 140, y); y += 10;

    if (presc.notes) {
      doc.setFillColor(255, 251, 235); doc.setDrawColor(245, 158, 11);
      doc.roundedRect(margin, y, pageW - margin * 2, 14, 2, 2, 'FD');
      doc.setTextColor(120, 53, 15);
      doc.setFont('helvetica', 'bolditalic'); doc.setFontSize(9);
      doc.text('Note clinique :', margin + 4, y + 5);
      doc.setFont('helvetica', 'italic');
      doc.text(presc.notes, margin + 4, y + 11, { maxWidth: pageW - margin * 2 - 8 });
      y += 20;
    }

    doc.setTextColor(30, 58, 138);
    doc.setFont('times', 'bolditalic'); doc.setFontSize(18);
    doc.text('Rp', margin, y + 6);
    doc.setDrawColor(30, 58, 138); doc.setLineWidth(0.4);
    doc.line(margin + 12, y + 3, pageW - margin, y + 3); y += 14;

    const items = presc.prescriptionItems ?? [];
    if (!items.length) {
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'italic'); doc.setFontSize(11);
      doc.text('Aucun médicament prescrit.', margin, y); y += 10;
    }

    items.forEach((item, i) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFillColor(30, 58, 138);
      doc.rect(margin, y - 1, 7, 9, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.text(`${i + 1}`, margin + 3.5, y + 5.5, { align: 'center' });
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
      doc.text(item.medicationName ?? `Médicament ${i + 1}`, margin + 10, y + 6);
      if (item.dosage) {
        doc.setFillColor(219, 234, 254); doc.setTextColor(30, 64, 175);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
        const dw = doc.getTextWidth(item.dosage) + 6;
        doc.roundedRect(pageW - margin - dw, y + 1, dw, 6, 1, 1, 'F');
        doc.text(item.dosage, pageW - margin - dw / 2, y + 5.5, { align: 'center' });
      }
      y += 11;
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      const details: string[] = [];
      if (item.frequency)           details.push(`Fréquence : ${item.frequency}`);
      if (item.administrationRoute) details.push(`Voie : ${item.administrationRoute}`);
      if (item.duration)            details.push(`Durée : ${item.duration} jour(s)`);
      if (item.dosageInstructions)  details.push(`Posologie : ${item.dosageInstructions}`);
      if (item.startDate)           details.push(`Début : ${new Date(item.startDate).toLocaleDateString('fr-FR')}`);
      if (item.endDate)             details.push(`Fin : ${new Date(item.endDate).toLocaleDateString('fr-FR')}`);
      if (details.length) { doc.text(details.join('   ·   '), margin + 10, y, { maxWidth: pageW - margin * 2 - 10 }); y += 6; }
      if (item.specialInstructions) {
        doc.setFillColor(239, 246, 255); doc.setTextColor(30, 64, 175);
        doc.setFont('helvetica', 'italic'); doc.setFontSize(8.5);
        doc.roundedRect(margin + 10, y, pageW - margin * 2 - 10, 8, 1, 1, 'F');
        doc.text(item.specialInstructions, margin + 13, y + 5.5); y += 11;
      }
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
    doc.text('KidneyCare · Parent Portal', pageW - margin, y + 8, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); doc.setFontSize(8);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageW - margin, y + 14, { align: 'right' });
    doc.text('Valable 3 mois à compter de la prescription', pageW - margin, y + 19, { align: 'right' });

    const dateStr2 = new Date(presc.prescriptionDate).toLocaleDateString('fr-FR').replace(/\//g, '-');
    doc.save(`Ordonnance_${presc.id}_${dateStr2}.pdf`);
  }

  /* ══════════════════════════════════════════════════
     DOSSIERS
  ══════════════════════════════════════════════════ */
  loadDossiers(): void {
    this.loading = true;
    this.error   = '';
    const isPatient = this.auth.hasRole([KEYCLOAK_ROLES.patient]);
    const obs = isPatient
      ? this.dossierService.getMesDossiers()
      : this.dossierService.getAllDossiers();
    obs.subscribe({
      next: (data) => {
        this.dossiers = data || [];
        this.loading  = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error   = err?.message || 'Error loading records.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  togglePatient(idDossier: number): void {
    this.expandedPatients[idDossier] = !this.expandedPatients[idDossier];
    if (this.expandedPatients[idDossier]) {
      if (!this.dossierSuivis[idDossier])    this.loadSuivisForDossier(idDossier);
      if (!this.dossierResultats[idDossier]) this.loadResultatsForDossier(idDossier);
      if (!this.messagesByDossierId[idDossier]) this.loadMessagesForDossier(idDossier);
    }
  }

  loadMessagesForDossier(id: number): void {
    this.loadingMessagesByDossier[id] = true;
    this.messageService.getByDossier(id).subscribe({
      next: list => {
        this.messagesByDossierId[id] = list || [];
        this.loadingMessagesByDossier[id] = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.messagesByDossierId[id] = [];
        this.loadingMessagesByDossier[id] = false;
        this.cdr.detectChanges();
      }
    });
  }

  sendMessagePatient(dossier: DossierMedical): void {
    const id   = dossier.idDossierMedical!;
    const text = (this.newMessageTextByDossier[id] || '').trim();
    if (!text) return;
    this.sendingMessageByDossier[id] = true;
    this.messageService.send({
      idDossierMedical: id,
      typeExpediteur:   'PATIENT' as TypeExpediteur,
      contenu:          text
    }).subscribe({
      next: () => {
        this.newMessageTextByDossier[id] = '';
        this.loadMessagesForDossier(id);
        this.sendingMessageByDossier[id] = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.sendingMessageByDossier[id] = false;
        this.notification.error(err?.message || 'Send error');
        this.cdr.detectChanges();
      }
    });
  }

  loadSuivisForDossier(idDossier: number): void {
    this.loadingSuivis[idDossier] = true;
    this.suiviService.getSuivisByDossier(idDossier).subscribe({
      next: (data) => {
        this.dossierSuivis[idDossier] = Array.isArray(data) ? data : (data ? [data] : []);
        this.loadImagesByDossier(idDossier);
        this.loadingSuivis[idDossier] = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.dossierSuivis[idDossier] = [];
        this.loadingSuivis[idDossier] = false;
      }
    });
  }

  loadImagesByDossier(idDossier: number): void {
    this.imageMedicaleService.getImagesByDossier(idDossier).subscribe({
      next: data  => { this.dossierImages[idDossier] = data; this.cdr.detectChanges(); },
      error: ()   => { this.dossierImages[idDossier] = []; }
    });
  }

  loadResultatsForDossier(idDossier: number): void {
    this.loadingResultats[idDossier] = true;
    this.resultatLaboratoireService.getByDossier(idDossier).subscribe({
      next: (data) => {
        this.dossierResultats[idDossier] = data || [];
        this.loadingResultats[idDossier] = false;
        (this.dossierResultats[idDossier] || []).forEach(r => {
          if (r.idResultatLaboratoire) {
            this.rapportBiService.getByBilan(r.idResultatLaboratoire).subscribe({
              next: rapports => {
                this.rapportsByResultatId[r.idResultatLaboratoire!] = rapports || [];
                this.cdr.detectChanges();
              },
              error: () => { this.rapportsByResultatId[r.idResultatLaboratoire!] = []; }
            });
          }
        });
        this.cdr.detectChanges();
      },
      error: () => {
        this.dossierResultats[idDossier] = [];
        this.loadingResultats[idDossier] = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadAlertes(): void {
    this.loadingAlertes = true;
    this.alerteService.getAlertes(this.alerteJours).subscribe({
      next:  data => { this.alertes = data || []; this.loadingAlertes = false; this.cdr.detectChanges(); },
      error: ()   => { this.alertes = [];          this.loadingAlertes = false; this.cdr.detectChanges(); }
    });
  }

  openDossierFromAlerte(a: Alerte): void {
    const d = this.dossiers.find(x => x.idDossierMedical === a.idDossierMedical);
    if (d) {
      this.expandedPatients[d.idDossierMedical!] = true;
      this.loadSuivisForDossier(d.idDossierMedical!);
      this.loadResultatsForDossier(d.idDossierMedical!);
      this.cdr.detectChanges();
    }
  }

  /* ── Images ──────────────────────────────────────── */
  private readonly placeholderImageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgaW5kaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';

  getImageUrl(cheminImage: string): string {
    if (!cheminImage) return this.placeholderImageUrl;
    if (cheminImage.startsWith('http')) return cheminImage;
    let path = cheminImage.startsWith('/') ? cheminImage : '/' + cheminImage;
    if (!path.startsWith('/uploads/')) path = '/uploads/' + cheminImage.replace(/^\//, '');
    return path;
  }
  viewImage(image: ImageMedicale): void { window.open(this.getImageUrl(image.cheminImage || ''), '_blank'); }
  onImageError(event: any): void {
    const img = event.target as HTMLImageElement;
    if (img?.src !== this.placeholderImageUrl) img.src = this.placeholderImageUrl;
  }
  getImageTypeLabel(typeImage: string): string {
    const types: { [key: string]: string } = {
      'ECHOGRAPHIE_RENALE':'Renal ultrasound','ECHOGRAPHIE_VESICALE':'Bladder ultrasound',
      'ECHOGRAPHIE_DOPPLER_RENAL':'Renal Doppler','SCANNER_ABDOMINAL':'Abdominal CT',
      'SCANNER_RENAL':'Renal CT','URO_SCANNER':'Uro-CT','IRM_RENALE':'Renal MRI',
      'IRM_ABDOMINALE':'Abdominal MRI','URO_IRM':'Uro-MRI',
      'RADIOGRAPHIE_ABDOMINALE':'Abdominal X-ray','SCINTIGRAPHIE_RENALE_STATIQUE':'Renal scintigraphy (DMSA)',
      'SCINTIGRAPHIE_RENALE_DYNAMIQUE':'Dynamic renal scintigraphy',
      'CYSTOGRAPHIE_RETRO_MICTIONNELLE':'Cystography','PHOTO_CLINIQUE':'Clinical photo','AUTRE':'Other'
    };
    return types[typeImage] || typeImage;
  }

  /* ── Formatage dates ─────────────────────────────── */
  formatDate(date: string | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
  }
  /** Valeur affichable d'un résultat (numérique+unité, texte ou ancienne valeur). */
  formatValeur(r: ResultatLaboratoire): string { return formatValeurResultat(r); }
  /** Date du résultat (dateRendu ou datePrelevement ou dateResultat). */
  formatDateResultat(r: ResultatLaboratoire): string {
    if (!r) return '—';
    const d = (r as any).dateRendu ?? (r as any).datePrelevement ?? r.dateResultat;
    return this.formatDate(d);
  }
  formatDateFull(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  }
  formatDateShort(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', { day:'2-digit', month:'2-digit', year:'numeric' });
  }

  /* ── Statuts ─────────────────────────────────────── */
  getStatusClass(resultat: string): string {
    const m: { [k: string]: string } = {
      'GUERISON':'status-success','REMISSION':'status-success','AMELIORATION':'status-success',
      'STABLE':'status-info','EN_COURS':'status-info','SOUS_SURVEILLANCE':'status-warning',
      'DETERIORATION':'status-danger','RECHUTE':'status-danger','URGENCE':'status-danger'
    };
    return m[resultat] || 'status-info';
  }
  getStatusIcon(resultat: string): string {
    const m: { [k: string]: string } = {
      'GUERISON':'✅','REMISSION':'🎉','AMELIORATION':'📈','STABLE':'➡️',
      'EN_COURS':'⏳','SOUS_SURVEILLANCE':'👁️','DETERIORATION':'📉','RECHUTE':'🔄','URGENCE':'🚨'
    };
    return m[resultat] || '📝';
  }
  getStatusLabel(resultat: string): string {
    const m: { [k: string]: string } = {
      'EN_COURS':'In progress','STABLE':'Stable','AMELIORATION':'Improvement',
      'DETERIORATION':'Deterioration','REMISSION':'Remission','RECHUTE':'Relapse',
      'GUERISON':'Cured','SOUS_SURVEILLANCE':'Under surveillance','URGENCE':'Emergency'
    };
    return m[resultat] || resultat;
  }

  /* ── Tests ───────────────────────────────────────── */
  get selectedTestCodeInForm(): string {
    const t = this.testsCatalog.find(x => x.idTestLaboratoire === this.selectedIdTestInForm);
    return t?.codeTest ?? t?.nomTest ?? '';
  }
  getTestClass(nomTest: string | undefined | null): string {
    if (!nomTest) return 'status-info';
    const m: { [k: string]: string } = {
      'CREATININEMIE':'status-danger','NFS':'status-info','PHOSPHOREMIE':'status-warning',
      'CALCEMIE':'status-warning','ELECTROPHORESE_PROTEINES':'status-info','UREE':'status-warning',
      'IONOGRAMME_SANGUIN':'status-info','BILAN_HEPATIQUE':'status-info','GLYCEMIE':'status-warning',
      'CRP':'status-warning','HEMOGLOBINE':'status-info','ALBUMINEMIE':'status-warning',
      'PROTEINURIE':'status-danger','HEMATURIE':'status-danger','CULTURE_URINE':'status-info','AUTRE':'status-info'
    };
    return m[String(nomTest)] || 'status-info';
  }

  /* ── Timeline ────────────────────────────────────── */
  getDefaultTimelineFilters(idDossier: number): { suivi: boolean; image: boolean; bilan: boolean } {
    if (!this.timelineFilters[idDossier]) {
      this.timelineFilters[idDossier] = { suivi: true, image: true, bilan: true };
    }
    return this.timelineFilters[idDossier];
  }
  toggleTimelineFilter(idDossier: number, key: 'suivi' | 'image' | 'bilan'): void {
    const f = this.getDefaultTimelineFilters(idDossier);
    f[key] = !f[key];
    this.cdr.detectChanges();
  }
  getTimelineEvents(dossier: DossierMedical): TimelineEvent[] {
    const id       = dossier.idDossierMedical!;
    const suivis   = this.dossierSuivis[id]    ?? [];
    const images   = this.dossierImages[id]    ?? [];
    const resultats = this.dossierResultats[id] ?? [];
    const filters  = this.getDefaultTimelineFilters(id);
    const events:  TimelineEvent[] = [];

    const stateFrom = (r: string): TimelineEventState => {
      const u = (r || '').toUpperCase();
      if (['AMELIORATION','REMISSION','GUERISON','COMPLIANCE_BONNE'].includes(u)) return 'improvement';
      if (['DETERIORATION','RECHUTE','URGENCE','HOSPITALISATION_REQUISE'].includes(u)) return 'deterioration';
      return 'stagnation';
    };

    suivis.forEach(s => {
      if (filters.suivi && (s.resultat || '').toUpperCase() !== 'HOSPITALISATION_REQUISE') {
        events.push({ type:'suivi', date: s.dateSuivi||'',
          label: this.getStatusLabel(s.resultat||'') + (s.notes ? ' — ' + s.notes.slice(0,60) + (s.notes.length>60?'…':'') : ''),
          state: stateFrom(s.resultat||''), payload:{ id: s.idSuivi }, raw: s });
      }
    });
    if (filters.image) {
      images.forEach(img => {
        events.push({ type:'image', date: img.dateCapture||'',
          label: this.getImageTypeLabel(img.typeImage) + (img.description ? ' — '+img.description.slice(0,50)+(img.description.length>50?'…':'') : ''),
          state: 'stagnation', payload:{ id: img.idImage }, raw: img });
      });
    }
    if (filters.bilan) {
      resultats.forEach(r => {
        events.push({ type:'bilan', date: r.dateResultat||'',
          label: (r.nomTest||r.codeTest||'Bilan') + ' — ' + formatValeurResultat(r),
          state: 'stagnation', payload:{ id: r.idResultatLaboratoire }, raw: r });
      });
    }
    events.sort((a, b) => (b.date||'').localeCompare(a.date||''));
    return events;
  }
  getTimelineStateClass(state: TimelineEventState): string {
    return { improvement:'timeline-state-amelioration', stagnation:'timeline-state-stagnation', deterioration:'timeline-state-deterioration' }[state] || 'timeline-state-stagnation';
  }
  getTimelineEventIcon(type: TimelineEventType): string {
    return { suivi:'📋', hospitalisation:'🏥', image:'📷', bilan:'🧪' }[type] || '•';
  }
  getImageUrlFromEvent(ev: TimelineEvent): string {
    if (ev.type !== 'image' || !ev.raw || !('cheminImage' in ev.raw)) return this.placeholderImageUrl;
    return this.getImageUrl((ev.raw as ImageMedicale).cheminImage || '');
  }
  viewImageFromEvent(ev: TimelineEvent): void {
    if (ev.type === 'image' && ev.raw && 'cheminImage' in ev.raw) this.viewImage(ev.raw as ImageMedicale);
  }
  openAffichageFromEvent(ev: TimelineEvent): void {
    if (ev.type === 'bilan' && ev.raw && 'valeurResultat' in ev.raw) this.openAffichagePopup(ev.raw as ResultatLaboratoire);
  }
  openBilanFromEvent(ev: TimelineEvent): void {
    if (ev.type === 'bilan' && ev.raw && 'valeurResultat' in ev.raw) this.openBilanPopup(ev.raw as ResultatLaboratoire);
  }
  openAddEventModal(dossier: DossierMedical, date?: string): void {
    this.addEventDossier = dossier;
    this.addEventDate    = date || new Date().toISOString().slice(0,10);
    this.addEventType    = 'suivi';
    this.showAddEventModal = true;
  }
  closeAddEventModal(): void { this.showAddEventModal = false; this.addEventDossier = null; }
  confirmAddEvent(): void {
    const d = this.addEventDossier;
    if (!d) return;
    if (this.addEventType === 'suivi' || this.addEventType === 'hospitalisation') {
      this.suiviFormDossier  = d;
      this.suiviFormDate     = this.addEventDate;
      this.suiviFormNotes    = '';
      this.suiviFormObjectif = '';
      this.suiviFormResultat = this.addEventType === 'hospitalisation' ? 'HOSPITALISATION_REQUISE' : 'STABLE';
      this.suiviFormError    = '';
      this.showSuiviFormPopup = true;
      this.closeAddEventModal();
    } else if (this.addEventType === 'bilan') {
      this.closeAddEventModal();
      this.selectedDossierForResultat = d;
      this.resultatDefaultDate        = this.addEventDate;
      this.selectedIdTestInForm       = null;
      this.resultatFormError          = '';
      this.showResultatFormPopup      = true;
    } else {
      this.closeAddEventModal();
      this.notification.info('To add an image: use the Medical images section.');
    }
    this.cdr.detectChanges();
  }
  onTimelineDrop(dossier: DossierMedical, event: DragEvent): void {
    event.preventDefault();
    this.timelineDragOver[dossier.idDossierMedical!] = false;
    const date = event.dataTransfer?.getData('text/plain');
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) this.openAddEventModal(dossier, date);
    else this.openAddEventModal(dossier);
  }
  onTimelineDragOver(dossier: DossierMedical, event: DragEvent): void {
    event.preventDefault();
    this.timelineDragOver[dossier.idDossierMedical!] = true;
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }
  onTimelineDragLeave(dossier: DossierMedical): void { this.timelineDragOver[dossier.idDossierMedical!] = false; }
  onDragStartDate(event: DragEvent, dossier: DossierMedical): void {
    const date = this.dragSourceDate || new Date().toISOString().slice(0,10);
    if (event.dataTransfer) { event.dataTransfer.setData('text/plain', date); event.dataTransfer.effectAllowed = 'copy'; }
  }
  openSuiviFormFromTimeline(dossier: DossierMedical): void { this.openAddEventModal(dossier); }
  closeSuiviFormPopup(): void { this.showSuiviFormPopup = false; this.suiviFormDossier = null; this.suiviFormError = ''; }
  submitSuiviForm(): void {
    const d = this.suiviFormDossier;
    if (!d?.idDossierMedical) return;
    this.suiviFormError  = '';
    this.suiviSubmitting = true;
    const suivi: Suivi = {
      idDossierMedical: d.idDossierMedical,
      dateSuivi: this.suiviFormDate,
      notes:     this.suiviFormNotes   || undefined,
      objectif:  this.suiviFormObjectif || undefined,
      resultat:  this.suiviFormResultat || 'STABLE'
    };
    this.suiviService.createSuivi(d.idDossierMedical, suivi).subscribe({
      next: () => {
        this.suiviSubmitting = false;
        this.loadSuivisForDossier(d.idDossierMedical!);
        this.closeSuiviFormPopup();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.suiviSubmitting = false;
        this.suiviFormError  = err?.message ?? 'Error saving.';
        this.cdr.detectChanges();
      }
    });
  }

  /* ── Tests labo ──────────────────────────────────── */
  openResultatForm(dossier: DossierMedical): void {
    this.selectedDossierForResultat = dossier;
    this.resultatDefaultDate        = new Date().toISOString().slice(0,10);
    this.selectedIdTestInForm       = null;
    this.resultatFormError          = '';
    this.showResultatFormPopup      = true;
    this.loadTestsCatalog();
  }
  loadTestsCatalog(): void {
    this.loadingTestsCatalog = true;
    this.testLaboratoireService.getAll().subscribe({
      next:  list => { this.testsCatalog = list || []; this.loadingTestsCatalog = false; this.cdr.detectChanges(); },
      error: ()   => { this.testsCatalog = [];          this.loadingTestsCatalog = false; this.cdr.detectChanges(); }
    });
  }
  closeResultatForm(): void { this.showResultatFormPopup = false; this.selectedDossierForResultat = null; this.resultatFormError = ''; }
  testTypeAlreadyExistsForDossier(idTestLaboratoire: number): boolean {
    if (!this.selectedDossierForResultat?.idDossierMedical) return false;
    return (this.dossierResultats[this.selectedDossierForResultat.idDossierMedical] ?? [])
      .some(r => r.idTestLaboratoire === idTestLaboratoire);
  }
  submitResultat(form: NgForm): void {
    if (form.invalid || !this.selectedDossierForResultat?.idDossierMedical) {
      Object.keys(form.controls).forEach(k => form.controls[k]?.markAsTouched());
      if (form.invalid) this.resultatFormError = 'Fill in all required fields.';
      this.cdr.detectChanges(); return;
    }
    const v     = form.value;
    const idTest = Number(v.idTestLaboratoire);
    if (this.testTypeAlreadyExistsForDossier(idTest)) {
      this.resultatFormError = 'This test type already exists for this record.';
      this.cdr.detectChanges(); return;
    }
    const dto: ResultatLaboratoire = {
      idDossierMedical:   this.selectedDossierForResultat.idDossierMedical!,
      idTestLaboratoire:  idTest,
      dateResultat:       v.dateResultat || new Date().toISOString().slice(0,10),
      valeurResultat:     (v.valeurResultat || '').trim(),
      etat:               v.etat?.trim()       || undefined,
      conclusion:         v.conclusion?.trim() || undefined
    };
    this.resultatSubmitting = true;
    this.resultatLaboratoireService.create(dto).subscribe({
      next: () => {
        this.resultatSubmitting = false;
        this.loadResultatsForDossier(this.selectedDossierForResultat!.idDossierMedical!);
        this.closeResultatForm(); form.reset();
        this.notification.success('Result recorded.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.resultatSubmitting = false;
        this.resultatFormError  = err?.message ?? err?.error?.message ?? 'Error.';
        this.cdr.detectChanges();
      }
    });
  }

  /* ── Bilans ──────────────────────────────────────── */
  openAffichagePopup(r: ResultatLaboratoire): void { this.selectedResultatAffichage = r; this.showAffichagePopup = true; }
  closeAffichagePopup(): void { this.showAffichagePopup = false; this.selectedResultatAffichage = null; }
  openBilanPopup(r: ResultatLaboratoire, dossier?: DossierMedical): void {
    this.selectedBilan           = r;
    this.selectedDossierForBilan = dossier || null;
    this.rapportsForBilan        = [];
    this.showBilanPopup          = true;
    if (r.idResultatLaboratoire) this.loadRapportsForBilan(r.idResultatLaboratoire);
  }
  closeBilanPopup(): void { this.showBilanPopup = false; this.selectedBilan = null; this.selectedDossierForBilan = null; this.rapportsForBilan = []; }
  canDeleteResultat(r: ResultatLaboratoire): boolean {
    if (!r.idResultatLaboratoire) return false;
    const rapports = this.rapportsByResultatId[r.idResultatLaboratoire];
    return !rapports || rapports.length === 0;
  }
  deleteResultat(r: ResultatLaboratoire, idDossier: number): void {
    if (!r.idResultatLaboratoire || !this.canDeleteResultat(r)) return;
    this.confirmService.confirm('Delete this test result?', { title: 'Delete result' }).then(ok => {
      if (!ok || r.idResultatLaboratoire == null) return;
      this.resultatLaboratoireService.delete(r.idResultatLaboratoire).subscribe({
        next:  () => { delete this.rapportsByResultatId[r.idResultatLaboratoire!]; this.loadResultatsForDossier(idDossier); this.cdr.detectChanges(); },
        error: (err) => this.notification.error(err?.message ?? 'Error deleting.')
      });
    });
  }
  loadRapportsForBilan(idResultat: number): void {
    this.loadingRapports = true;
    this.rapportBiService.getByBilan(idResultat).subscribe({
      next:  data => { this.rapportsForBilan = data || []; this.loadingRapports = false; this.cdr.detectChanges(); },
      error: ()   => { this.rapportsForBilan = [];         this.loadingRapports = false; this.cdr.detectChanges(); }
    });
  }
  openBilanPdf(idRapportBilan: number): void {
    this.rapportBiService.getPdf(idRapportBilan).subscribe({
      next: blob => { const url = URL.createObjectURL(blob); window.open(url, '_blank', 'noopener'); setTimeout(() => URL.revokeObjectURL(url), 60000); },
      error: err  => this.notification.error(err?.message || 'PDF unavailable')
    });
  }
  exportRapportPdf(rap: RapportBi): void {
    this.rapportBiService.exportRapportAsPdf(rap, { patientName: this.selectedDossierForBilan?.patientNom });
  }

  /* ── Analyse logique du risque de rechute ───────────────────────────── */
  getRelapseRisk(dossier: DossierMedical): {
    score: number;
    label: string;
    labelClass: string;
    factors: { name: string; value: string; impact: string; points: number }[];
  } {
    const suivis = this.dossierSuivis[dossier.idDossierMedical!] ?? [];
    const factors: { name: string; value: string; impact: string; points: number }[] = [];

    let total = 0;

    // 1) Gravité du diagnostic (profil de base)
    const diagBase: Record<string, { label: string; points: number }> = {
      SYNDROME_NEPHROTIQUE_CORTICORESISTANT: { label: 'Très à risque', points: 22 },
      REJET_DE_GREFFE:                      { label: 'Très à risque', points: 22 },
      LUPUS_NEPHRITE:                       { label: 'Risque important', points: 18 },
      GLOMERULONEPHRITE_CHRONIQUE:          { label: 'Risque important', points: 16 },
      POST_TRANSPLANTATION_RENALE:          { label: 'Risque modéré', points: 14 },
      SYNDROME_NEPHROTIQUE_CORTICOSENSIBLE: { label: 'Risque modéré', points: 12 },
      SYNDROME_NEPHROTIQUE:                 { label: 'Risque modéré', points: 12 },
      INSUFFISANCE_RENALE_CHRONIQUE:        { label: 'Risque de fond', points: 10 },
    };
    const diagKey = dossier.diagnostic ?? 'AUTRE';
    const base = diagBase[diagKey] ?? { label: 'Risque de fond', points: 8 };
    const p1 = Math.min(25, base.points);
    factors.push({
      name: 'Profil diagnostique',
      value: diagKey || '—',
      impact: base.label,
      points: p1,
    });
    total += p1;

    // 2) Historique de rechutes
    const nbRechutes = suivis.filter(s => (s.resultat ?? '').toUpperCase() === 'RECHUTE').length;
    let p2 = 0;
    let impactRechute = 'Aucune rechute documentée';
    if (nbRechutes === 1) { p2 = 8; impactRechute = 'Antécédent isolé de rechute'; }
    else if (nbRechutes === 2) { p2 = 14; impactRechute = 'Rechutes répétées'; }
    else if (nbRechutes >= 3) { p2 = 20; impactRechute = 'Rechutes fréquentes'; }
    factors.push({
      name: 'Épisodes de rechute',
      value: `${nbRechutes} épisode(s)`,
      impact: impactRechute,
      points: p2,
    });
    total += p2;

    // 3) Fraîcheur du dernier suivi
    let p3 = 0;
    let lastSuiviDate = '';
    let impactSuivi = '';
    if (suivis.length > 0) {
      const last = [...suivis].sort((a, b) => (b.dateSuivi || '').localeCompare(a.dateSuivi || ''))[0];
      lastSuiviDate = last.dateSuivi ? this.formatDateShort(last.dateSuivi) : '—';
      const months = last.dateSuivi ? (Date.now() - new Date(last.dateSuivi).getTime()) / (30 * 24 * 60 * 60 * 1000) : 0;
      if (months <= 1) { p3 = 4; impactSuivi = 'Suivi très récent'; }
      else if (months <= 3) { p3 = 8; impactSuivi = 'Suivi récent'; }
      else if (months <= 6) { p3 = 14; impactSuivi = 'Suivi ancien — à rapprocher'; }
      else { p3 = 20; impactSuivi = 'Suivi très ancien / absent récemment'; }
    } else {
      lastSuiviDate = 'Aucun suivi';
      p3 = 16;
      impactSuivi = 'Aucun suivi disponible';
    }
    factors.push({
      name: 'Dernier suivi',
      value: lastSuiviDate,
      impact: impactSuivi,
      points: p3,
    });
    total += p3;

    // 4) Tendance du dernier résultat
    let p4 = 0;
    let lastResultat = '—';
    let impactResultat = 'Données insuffisantes';
    if (suivis.length > 0) {
      lastResultat = [...suivis].sort((a, b) => (b.dateSuivi || '').localeCompare(a.dateSuivi || ''))[0].resultat ?? '—';
      const r = (lastResultat || '').toUpperCase();
      if (['RECHUTE', 'DETERIORATION', 'URGENCE'].includes(r)) { p4 = 22; impactResultat = 'Situation instable / aggravation'; }
      else if (['SOUS_SURVEILLANCE', 'EN_COURS'].includes(r)) { p4 = 14; impactResultat = 'Évolution incertaine, sous surveillance'; }
      else if (['STABLE', 'AMELIORATION', 'REMISSION'].includes(r)) { p4 = 6; impactResultat = 'État stable ou en amélioration'; }
      else if (r === 'GUERISON') { p4 = 0; impactResultat = 'Guérison documentée'; }
      else { p4 = 10; impactResultat = 'Résultat non catégorisable'; }
    }
    factors.push({
      name: 'Résultat dernier suivi',
      value: this.getStatusLabel(lastResultat),
      impact: impactResultat,
      points: p4,
    });
    total += p4;

    // 5) Densité des suivis (qualité du monitoring)
    const nbSuivis = suivis.length;
    let p5 = 0;
    let impactNb = '';
    if (nbSuivis === 0) { p5 = 16; impactNb = 'Aucun suivi en base'; }
    else if (nbSuivis <= 2) { p5 = 10; impactNb = 'Peu de suivis — données limitées'; }
    else if (nbSuivis <= 5) { p5 = 6; impactNb = 'Suivi modéré'; }
    else { p5 = 2; impactNb = 'Bon niveau de suivi'; }
    factors.push({
      name: 'Nombre de suivis',
      value: `${nbSuivis} suivi(s)`,
      impact: impactNb,
      points: p5,
    });
    total += p5;

    const score = Math.min(100, Math.round(total));
    let label = 'Faible';
    let labelClass = 'risk-low';
    if (score >= 70) { label = 'Élevé'; labelClass = 'risk-high'; }
    else if (score >= 40) { label = 'Modéré'; labelClass = 'risk-medium'; }

    return { score, label, labelClass, factors };
  }

  openSuiviPopup(dossier: DossierMedical): void { console.log('Suivi popup:', dossier.idDossierMedical); }
  viewFullDossier(idDossier: number): void { this.router.navigate(['/back/dossiers']); }

  /* ── Formulaires modaux ──────────────────────────── */
  openAppointmentFromHome($event: Event): void { $event.preventDefault(); this.appointmentModal.open(); }
  toggleNotifications(): void  { this.showNotifications = !this.showNotifications; this.showProfile = false; }
  toggleProfile(): void        { this.showProfile = !this.showProfile; this.showNotifications = false; }
  openAppointmentForm(): void  { this.showAppointmentForm  = true; }
  closeAppointmentForm(): void { this.showAppointmentForm  = false; }
  openEmergencyForm(): void    { this.showEmergencyForm    = true; }
  closeEmergencyForm(): void   { this.showEmergencyForm    = false; }
  openMedicalReportForm(): void  { this.showMedicalReportForm  = true; }
  closeMedicalReportForm(): void { this.showMedicalReportForm  = false; }
  openLabResultForm(): void      { this.showLabResultForm      = true; }
  closeLabResultForm(): void     { this.showLabResultForm      = false; }
  openTreatmentForm(): void      { this.showTreatmentForm      = true; }
  closeTreatmentForm(): void     { this.showTreatmentForm      = false; }

  onSubmitAppointment(form: NgForm):    void { if (form.valid) { this.notification.success('Appointment request sent.'); this.closeAppointmentForm(); form.reset(); } }
  onSubmitEmergency(form: NgForm):      void { if (form.valid) { this.notification.success('Emergency sent!'); this.closeEmergencyForm(); form.reset(); } }
  onSubmitMedicalReport(form: NgForm):  void { if (form.valid) { this.notification.info('Generating report…'); this.closeMedicalReportForm(); form.reset(); } }
  onSubmitLabResult(form: NgForm):      void { if (form.valid) { this.notification.info('Fetching results…'); this.closeLabResultForm(); form.reset(); } }
  onSubmitTreatment(form: NgForm):      void { if (form.valid) { this.notification.info('Loading treatment…'); this.closeTreatmentForm(); form.reset(); } }

  /* ── Chatbot ─────────────────────────────────────── */
  initChatbot(): void {
    this.chatMessages = [{ role: 'bot', text: this.nephroChatbot.getWelcomeMessage(), date: new Date() }];
  }
  toggleChatbot(): void {
    this.chatOpen = !this.chatOpen;
    if (this.chatOpen && this.chatMessages.length === 0) this.initChatbot();
    this.cdr.detectChanges();
  }
  sendChatMessage(): void {
    const text = (this.chatUserInput || '').trim();
    if (!text) return;
    this.chatMessages.push({ role: 'user', text, date: new Date() });
    this.chatUserInput = '';
    this.chatMessages.push({ role: 'bot', text: this.nephroChatbot.getReply(text), date: new Date() });
    this.cdr.detectChanges();
  }

  logout(): void {
    localStorage.removeItem('patientId');
    this.auth.logout();
  }
}