import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

export interface Consultation {
  idConsultation: number;
  dateConsultation: string;
  diagnostic: string;
  notes?: string;
}

export interface Patient {
  idPatient: number;
  firstName: string;
  lastName:  string;
}

export interface RendezvousForm {
  dateRendezvous: string;
  etat:           string;
}

export interface AppNotification {
  visible:  boolean;
  type:     'success' | 'error' | 'warning';
  title:    string;
  message:  string;
  rdvId?:   number;
  rdvDate?: string;
  rdvEtat?: string;
  patient?: string;
}

@Component({
  selector:    'app-ajouter-rendezvous',
  standalone:  true,
  imports:     [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './ajouter-rendezvous.html'
})
export class AjouterRendezvousComponent implements OnInit {

  private readonly API_ADD_RDV = `${environment.projetApiRoot}/rendezvous/addRendezvous`;
  private readonly API_PATIENTS = `${environment.projetApiRoot}/patient/retrievePatients`;
  private readonly API_CONSULTS = `${environment.projetApiRoot}/consultation/sansRendezvous`;

  isLoading            = false;
  formProgress         = 0;
  loadingConsultations = false;
  loadingPatients      = false;
  consultationsError   = '';
  patientsError        = '';

  consultationsList:      Consultation[] = [];
  patientsList:           Patient[]      = [];
  selectedConsultationId: number | null  = null;

  // ✅ FIX 1 : initialisé à 0 (pas null) pour que le select Angular fonctionne
  selectedPatientId: number = 0;

  rendezvous: RendezvousForm = { dateRendezvous: '', etat: '' };

  notification: AppNotification = {
    visible: false, type: 'success', title: '', message: ''
  };

  toastVisible = false;
  toastMessage = '';
  toastType    = 'toast-success';

  // Date min pour le champ datetime-local
  get minDate(): string {
    return new Date().toISOString().slice(0, 16);
  }

  // Alias utilisé dans le template [min]="minRendezvousDate"
  get minRendezvousDate(): string {
    return this.minDate;
  }

  private get headers(): HttpHeaders {
    const token = this.auth.getToken();
    if (!token) return new HttpHeaders({ 'Content-Type': 'application/json' });
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json'
    });
  }

  constructor(
    private http:   HttpClient,
    private router: Router,
    private auth:   AuthService
  ) {}

  ngOnInit(): void {
    const load = () => {
      this.loadPatients();
      this.loadConsultations();
    };
    if (this.auth.isLoggedIn() && this.auth.getToken()) {
      load();
    } else {
      setTimeout(load, 600);
    }
  }

  loadPatients(): void {
    this.loadingPatients = true;
    this.patientsError   = '';
  
    this.http.get<any[]>(this.API_PATIENTS, { headers: this.headers }).subscribe({
      next: (data) => {
        console.log('📥 Raw patients data:', data);  // ← voir la structure exacte
  
        const arr = Array.isArray(data) ? data : [];
        console.log('📥 Array length:', arr.length);
        if (arr.length > 0) console.log('📥 Premier patient:', arr[0]);  // ← voir les champs
  
        this.patientsList = arr.map((p: any) => ({
          // ✅ Couvre tous les noms de champs possibles
          idPatient: Number(
            p.idPatient ?? p.id_patient ?? p.id ?? p.patientId ?? 0
          ),
          firstName: p.firstName ?? p.first_name ?? p.prenom ?? p.nom ?? '',
          lastName:  p.lastName  ?? p.last_name  ?? p.nom    ?? ''
        })).filter(p => p.idPatient > 0);
  
        console.log('✅ patientsList mappé:', this.patientsList);
        this.loadingPatients = false;
      },
      error: (err) => {
        console.error('❌ Erreur patients status:', err.status);
        console.error('❌ Erreur patients body:', err.error);
        this.loadingPatients = false;
        this.patientsList    = [];
  
        if      (err?.status === 0)   this.patientsError = '❌ Backend (port 8081) inaccessible.';
        else if (err?.status === 401) this.patientsError = '❌ Non authentifié — reconnectez-vous.';
        else if (err?.status === 403) this.patientsError = '❌ Accès refusé.';
        else if (err?.status === 404) this.patientsError = '❌ Endpoint /projet/patient/retrievePatients introuvable.';
        else                          this.patientsError = err?.error?.message || 'Impossible de charger les patients.';
      }
    });
  }
  loadConsultations(): void {
    this.loadingConsultations = true;
    this.consultationsError   = '';
    this.http.get<any[]>(this.API_CONSULTS, { headers: this.headers }).subscribe({
      next: (data) => {
        const arr = Array.isArray(data) ? data : [];
        this.consultationsList = arr.map((c: any) => ({
          idConsultation:   c.idConsultation ?? c.id ?? 0,
          dateConsultation: typeof c.dateConsultation === 'string'
            ? c.dateConsultation
            : (c.dateConsultation ? new Date(c.dateConsultation).toISOString().slice(0, 10) : ''),
          diagnostic: c.diagnostic ?? '',
          notes:      c.notes ?? ''
        })).filter((c: any) => c.idConsultation > 0);
        this.loadingConsultations = false;
      },
      error: (err) => {
        this.loadingConsultations = false;
        this.consultationsList    = [];
        this.consultationsError   = err?.error?.message || 'Impossible de charger les consultations.';
      }
    });
  }

  getSelectedConsultation(): Consultation | undefined {
    return this.consultationsList.find(c => c.idConsultation === this.selectedConsultationId);
  }

  getSelectedPatient(): Patient | undefined {
    return this.patientsList.find(p => p.idPatient === this.selectedPatientId);
  }

  getEtatLabel(etat: string): string {
    const m: Record<string, string> = {
      PREVU: '🕐 Prévu', PLANIFIE: '📋 Planifié',
      CONFIRME: '✅ Confirmé', TERMINE: '🏁 Terminé', ANNULE: '❌ Annulé'
    };
    return m[etat] || etat;
  }

  getEtatClass(etat: string): string {
    const m: Record<string, string> = {
      CONFIRME: 'etat-confirme', PLANIFIE: 'etat-planifie',
      PREVU: 'etat-prevu', TERMINE: 'etat-termine', ANNULE: 'etat-annule'
    };
    return m[etat] || 'etat-prevu';
  }

  onConsultationChange(): void { this.calcProgress(); }

  onDateChange(): void {
    if (!this.rendezvous.dateRendezvous) return;
    const sel   = new Date(this.rendezvous.dateRendezvous);
    const today = new Date();
    if (this.rendezvous.etat !== 'ANNULE') {
      if      (sel.toDateString() === today.toDateString()) this.rendezvous.etat = 'CONFIRME';
      else if (sel < today)                                 this.rendezvous.etat = 'TERMINE';
      else if (!this.rendezvous.etat)                       this.rendezvous.etat = 'PLANIFIE';
    }
    this.calcProgress();
  }

  calcProgress(): void {
    let n = 0;
    if (this.rendezvous.dateRendezvous?.trim()) n++;
    if (this.rendezvous.etat?.trim())           n++;
    if (this.selectedPatientId > 0)             n++;  // ✅ FIX 2 : > 0 au lieu de truthy
    this.formProgress = Math.round((n / 3) * 100);
  }

  resetForm(): void {
    this.rendezvous             = { dateRendezvous: '', etat: '' };
    this.selectedPatientId      = 0;   // ✅ reset à 0
    this.selectedConsultationId = null;
    this.closeNotification();
    this.calcProgress();
  }

  showNotification(notif: Partial<AppNotification>): void {
    this.notification = { visible: true, type: 'success', title: '', message: '', ...notif };
    if (notif.type === 'success') setTimeout(() => this.closeNotification(), 8000);
  }

  closeNotification(): void { this.notification.visible = false; }

  showToast(msg: string, type = 'toast-success'): void {
    this.toastMessage = msg;
    this.toastType    = type;
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 4000);
  }

  saveRendezvous(): void {
    // ✅ FIX 3 : validation avec > 0
    if (!this.rendezvous.dateRendezvous || !this.rendezvous.etat || !(this.selectedPatientId > 0)) {
      this.showToast('Veuillez remplir tous les champs obligatoires', 'toast-error');
      return;
    }

    let etat = this.rendezvous.etat;
    if (etat !== 'ANNULE') {
      const sel   = new Date(this.rendezvous.dateRendezvous);
      const today = new Date();
      if      (sel.toDateString() === today.toDateString()) etat = 'CONFIRME';
      else if (sel < today)                                 etat = 'TERMINE';
    }

    this.isLoading = true;
    this.closeNotification();

    const dateStr        = (this.rendezvous.dateRendezvous || '').trim();
    const dateForBackend = dateStr.includes('T')
      ? dateStr.slice(0, 16)
      : dateStr.slice(0, 10) + 'T00:00';

    const payload: Record<string, unknown> = {
      dateRendezvous: dateForBackend,
      etat:           etat,
      idPatient:      Number(this.selectedPatientId),
    };
    if (this.selectedConsultationId != null) {
      payload['idConsultation'] = Number(this.selectedConsultationId);
    }

    console.log('📤 POST', this.API_ADD_RDV, payload);

    this.http.post<any>(this.API_ADD_RDV, payload, { headers: this.headers }).subscribe({
      next: (res) => {
        console.log('✅ Rendez-vous créé:', res);
        this.isLoading = false;

        const patient    = this.getSelectedPatient();
        const nomPatient = patient
          ? `${patient.firstName} ${patient.lastName}`
          : `Patient #${this.selectedPatientId}`;

        this.showNotification({
          type:    'success',
          title:   '✅ Rendez-vous créé avec succès !',
          message: `Le rendez-vous de ${nomPatient} a bien été enregistré.`,
          rdvId:   res?.idRendezvous ?? res?.id,
          rdvDate: this.rendezvous.dateRendezvous,
          rdvEtat: etat,
          patient: nomPatient,
        });

        this.showToast('Rendez-vous créé ✅', 'toast-success');

        this.rendezvous             = { dateRendezvous: '', etat: '' };
        this.selectedPatientId      = 0;
        this.selectedConsultationId = null;
        this.formProgress           = 0;

        this.loadConsultations();
        setTimeout(() => this.router.navigate(['/back/consultations']), 3500);
      },
      error: (err) => {
        console.error('❌ Erreur:', err.status, err.error, err.url);
        this.isLoading = false;

        let msg = "Une erreur est survenue lors de l'enregistrement.";
        if      (err.status === 0)   msg = 'Serveur inaccessible. Vérifiez Spring Boot sur le port 8081.';
        else if (err.status === 400) msg = err.error?.message || 'Données invalides.';
        else if (err.status === 401) msg = 'Session expirée. Reconnectez-vous.';
        else if (err.status === 403) msg = 'Accès refusé.';
        else if (err.status === 404) msg = 'Patient ou consultation introuvable en base.';
        else if (err.status === 409) msg = 'Un rendez-vous existe déjà pour ce créneau.';
        else if (err.error?.message) msg = err.error.message;

        this.showNotification({ type: 'error', title: '❌ Échec', message: msg });
        this.showToast(msg, 'toast-error');
      }
    });
  }
}