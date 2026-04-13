import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

export interface Rendezvous {
  idRendezvous:   number;
  dateRendezvous: string;
  etat?:          string;
  patient?:       { idPatient: number };
}

export interface PatientDTO {
  idPatient:  number;
  firstName:  string;
  lastName:   string;
  username?:  string;
  email?:     string;
}

export interface MedecinDTO {
  idMedecin: number;
  nom:       string;
  prenom:    string;
  username?: string;
}

export interface Consultation {
  dateConsultation: string;
  diagnostic:       string;
  notes:            string;
  idDossiermedical: number | null;
  idPatient?:       number | null;
  idMedecin?:       number | null;
  rendezvous?:      { idRendezvous: number } | null;
}

@Component({
  selector:    'app-consultation',
  standalone:  false,
  templateUrl: './consultation.html',
  styleUrls:   ['./consultation.css']
})
export class ConsultationComponent implements OnInit {

  private readonly API             = `${environment.projetApiRoot}/consultation/addConsultation`;
  private readonly RDV_DISPONIBLES = `${environment.projetApiRoot}/rendezvous/disponibles`;
  private readonly PATIENTS_API    = `${environment.projetApiRoot}/patient/retrievePatients`;
  private readonly MEDECIN_ME_API  = `${environment.projetApiRoot}/medecin/me`;
  private readonly MEDECINS_API    = `${environment.projetApiRoot}/medecin/retrieveMedecins`;

  isLoading    = false;
  toastVisible = false;
  toastMessage = '';
  toastType    = 'toast-success';
  formProgress = 0;
  today        = new Date().toISOString().split('T')[0];

  rendezvousList:       Rendezvous[]  = [];
  patientsList:         PatientDTO[]  = [];
  medecinsList:         MedecinDTO[]  = [];
  selectedRendezvousId: number | null = null;
  selectedPatientId:    number | null = null;
  selectedMedecinId:    number | null = null;
  consultation: Consultation          = this.emptyConsultation();

  connectedMedecinName: string | null = null;
  doctor = { initials: 'DR', name: 'Médecin', role: 'Médecin' };

  private get authHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
  }

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const load = () => {
      this.loadPatients();
      this.loadMedecin();
      this.loadRendezvousDisponibles();
      this.calcProgress();
    };
    if (this.auth.isLoggedIn() && this.auth.getToken()) {
      load();
    } else {
      setTimeout(load, 600);
    }
  }

  // ─────────────────────────────────────────
  // Patients depuis projetconsultation (port 8081)
  // ─────────────────────────────────────────
  loadPatients(): void {
    this.http.get<PatientDTO[]>(this.PATIENTS_API, { headers: this.authHeaders }).subscribe({
      next: (data) => {
        this.patientsList = (data || []).map(p => ({
          idPatient: p.idPatient,
          firstName: p.firstName ?? '',
          lastName:  p.lastName  ?? '',
          username:  p.username,
        }));
        console.log('✅ Patients:', this.patientsList.length);
        this.autoSelectPatient();
      },
      error: (err) => {
        console.error('❌ Patients:', err);
        this.patientsList = [];
        this.showToast('Impossible de charger les patients', 'toast-error');
      }
    });
  }

  // ─────────────────────────────────────────
  // Médecin connecté : /me (JWT) puis fallback sur retrieveMedecins
  // ─────────────────────────────────────────
  loadMedecin(): void {
    this.http.get<MedecinDTO>(this.MEDECIN_ME_API, { headers: this.authHeaders }).subscribe({
      next: (m) => this.applyMedecin(m),
      error: () => this.loadMedecinFallback()
    });
  }

  private applyMedecin(m: MedecinDTO): void {
    this.medecinsList = [{
      idMedecin: m.idMedecin,
      nom:       m.nom ?? '',
      prenom:    m.prenom ?? '',
      username:  m.username
    }];
    this.selectedMedecinId   = m.idMedecin;
    this.connectedMedecinName = `${m.prenom ?? ''} ${m.nom ?? ''}`.trim();

    const initials = ((m.prenom?.[0] ?? '') + (m.nom?.[0] ?? '')).toUpperCase();
    this.doctor = {
      initials: initials || 'DR',
      name:     `Dr. ${m.prenom ?? ''} ${m.nom ?? ''}`.trim(),
      role:     'Médecin'
    };
    console.log('✅ Médecin connecté:', this.connectedMedecinName);
    this.calcProgress();
  }

  private loadMedecinFallback(): void {
    this.http.get<MedecinDTO[]>(this.MEDECINS_API, { headers: this.authHeaders }).subscribe({
      next: (list) => {
        const arr = list ?? [];
        const profile = this.auth.getProfile();
        const username = profile?.username as string | undefined;
        const match = username && arr.find(m => (m as MedecinDTO & { username?: string }).username === username);
        const m = match ?? arr[0];
        if (m) {
          this.applyMedecin(m);
          if (!match) this.showToast('Médecin pré-sélectionné (reconnectez-vous pour une correspondance exacte)', 'toast-success');
        } else {
          this.medecinsList = [];
          this.selectedMedecinId = null;
          this.showToast('Aucun médecin en base. Connectez-vous en tant que médecin.', 'toast-error');
        }
      },
      error: () => {
        this.medecinsList = [];
        this.selectedMedecinId = null;
        this.showToast('Impossible de charger les médecins. Vérifiez que le backend (port 8081) est démarré.', 'toast-error');
      }
    });
  }

  // ─────────────────────────────────────────
  // RDV disponibles
  // ─────────────────────────────────────────
  loadRendezvousDisponibles(): void {
    this.http
      .get<Rendezvous[]>(this.RDV_DISPONIBLES, { headers: this.authHeaders })
      .subscribe({
        next: (data) => {
          this.rendezvousList = Array.isArray(data) ? data : [];
          console.log('✅ RDV:', this.rendezvousList.length);
          this.autoSelectRdv();
        },
        error: (err) => {
          console.error('❌ RDV:', err);
          this.rendezvousList = [];
          this.showToast('Impossible de charger les rendez-vous', 'toast-error');
        }
      });
  }

  // ─────────────────────────────────────────
  // Pré-sélections automatiques
  // ─────────────────────────────────────────
  private autoSelectPatient(): void {
    if (this.patientsList.length === 1) {
      this.selectedPatientId = this.patientsList[0].idPatient;
      this.calcProgress();
    }
  }

  private autoSelectRdv(): void {
    if (this.rendezvousList.length === 1) {
      this.selectedRendezvousId = this.rendezvousList[0].idRendezvous;
      this.syncPatientFromRdv();
      this.calcProgress();
    }
  }

  private syncPatientFromRdv(): void {
    const rdv = this.getSelectedRdv();
    const pid = rdv?.patient?.idPatient;
    if (pid && this.patientsList.some(p => p.idPatient === pid)) {
      this.selectedPatientId = pid;
      this.calcProgress();
    }
  }

  // ─────────────────────────────────────────
  // Événements
  // ─────────────────────────────────────────
  onRdvChange():     void { this.syncPatientFromRdv(); this.calcProgress(); }
  onPatientChange(): void { this.calcProgress(); }
  onMedecinChange(): void { this.calcProgress(); }

  getSelectedRdv(): Rendezvous | undefined {
    return this.rendezvousList.find(r => r.idRendezvous === this.selectedRendezvousId);
  }

  getSelectedPatient(): PatientDTO | undefined {
    return this.patientsList.find(p => p.idPatient === this.selectedPatientId);
  }

  getSelectedMedecin(): MedecinDTO | undefined {
    return this.medecinsList.find(m => m.idMedecin === this.selectedMedecinId);
  }

  // ─────────────────────────────────────────
  // Progression
  // ─────────────────────────────────────────
  calcProgress(): void {
    let score = 0;
    if (this.consultation.dateConsultation)                                            score += 20;
    if (this.consultation.diagnostic.length >= 5)                                     score += 20;
    if (this.consultation.idDossiermedical && this.consultation.idDossiermedical > 0) score += 20;
    if (this.selectedRendezvousId)                                                    score += 20;
    if (this.selectedPatientId)                                                       score += 10;
    if (this.selectedMedecinId)                                                       score += 10;
    this.formProgress = Math.min(100, score);
  }

  emptyConsultation(): Consultation {
    return {
      dateConsultation: new Date().toISOString().split('T')[0],
      diagnostic:       '',
      notes:            '',
      idDossiermedical: null
    };
  }

  resetForm(): void {
    this.consultation         = this.emptyConsultation();
    this.selectedRendezvousId = null;
    this.selectedPatientId    = null;
    if (!this.connectedMedecinName) this.selectedMedecinId = null;
    this.calcProgress();
    this.loadRendezvousDisponibles();
  }
  saveConsultation(): void {
    if (!this.consultation.idDossiermedical || this.consultation.idDossiermedical <= 0) {
      this.showToast('Veuillez renseigner un ID de dossier valide', 'toast-error');
      return;
    }
    if (this.consultation.diagnostic.trim().length < 5) {
      this.showToast('Le diagnostic doit contenir au moins 5 caractères', 'toast-error');
      return;
    }
    if (!this.selectedPatientId) {
      this.showToast('Veuillez sélectionner un patient', 'toast-error');
      return;
    }
    if (!this.selectedMedecinId) {
      this.showToast('Aucun médecin sélectionné', 'toast-error');
      return;
    }
    if (!this.selectedRendezvousId) {
      this.showToast('Veuillez sélectionner un rendez-vous', 'toast-error');
      return;
    }
  
    this.isLoading = true;
  
    // ✅ FIX : date envoyée comme string ISO "yyyy-MM-dd"
    //    @JsonFormat côté Java gère la conversion
    const payload = {
      dateConsultation: this.consultation.dateConsultation,  // "2025-03-05"
      diagnostic:       this.consultation.diagnostic.trim(),
      notes:            this.consultation.notes?.trim() || '',
      idDossiermedical: Number(this.consultation.idDossiermedical),
      idPatient:        this.selectedPatientId,
      idMedecin:        this.selectedMedecinId,
      rendezvous:       { idRendezvous: this.selectedRendezvousId }
    };
  
    console.log('📤 Payload envoyé :', JSON.stringify(payload, null, 2));
  
    this.http
      .post<any>(this.API, payload, { headers: this.authHeaders })
      .subscribe({
        next: (res) => {
          console.log('✅ Consultation créée :', res);
          this.showToast('Consultation créée avec succès ✅', 'toast-success');
          this.resetForm();
          this.isLoading = false;
          setTimeout(() => this.router.navigate(['/back/consultations']), 1800);
        },
        error: (err) => {
          console.error('❌ Erreur POST :', err);
          console.error('❌ Status :', err.status);
          console.error('❌ Body :', err.error);
          const backendMsg = err?.error?.message;
          const msg = err?.status === 0
            ? '❌ Serveur inaccessible — vérifiez que le backend (port 8081) tourne'
            : err?.status === 400 || err?.status === 404
              ? (backendMsg ? '❌ ' + backendMsg : '❌ Données invalides ou ressource introuvable.')
              : backendMsg || '❌ Erreur lors de l\'enregistrement';
          this.showToast(msg, 'toast-error');
          this.isLoading = false;
        }
      });
  }

  showToast(message: string, type = 'toast-success'): void {
    this.toastMessage = message;
    this.toastType    = type;
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 3500);
  }

  logout(): void {}
}