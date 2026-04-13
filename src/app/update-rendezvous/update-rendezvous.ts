import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface RendezvousUpdate {
  idRendezvous?: number;
  dateRendezvous: string;
  etat: string;
  consultation?: { idConsultation: number } | null;
}

export interface ConsultationItem {
  idConsultation: number;
  dateConsultation: string;
  diagnostic: string;
  notes?: string;
}

@Component({
  selector: 'app-update-rendezvous',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './update-rendezvous.html',
  styleUrls: ['./update-rendezvous.css']
})
export class UpdateRendezvousComponent implements OnInit {

  private readonly BASE         = `${environment.projetApiRoot}/rendezvous`;
  private readonly BASE_CONSULT = `${environment.projetApiRoot}/consultation`;

  rendezvousId: number | null = null;
  isLoading    = false;
  isFetching   = true;
  formProgress = 0;

  rendezvous: RendezvousUpdate = { dateRendezvous: '', etat: '' };

  consultationsList:      ConsultationItem[]  = [];
  selectedConsultationId: number | null       = null;
  selectedPatientId:      number | null       = null;

  toastVisible = false;
  toastMessage = '';
  toastType    = 'toast-success';

  constructor(
    private http:   HttpClient,
    private route:  ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.rendezvousId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadConsultations();
    this.loadRendezvous();
  }

  loadConsultations(): void {
    this.http.get<ConsultationItem[]>(`${this.BASE_CONSULT}/retrieveConsultations`).subscribe({
      next: (data) => this.consultationsList = data,
      error: () => {
        this.consultationsList = [
          { idConsultation: 1, dateConsultation: '2026-02-18', diagnostic: 'Rejet aigu de greffe stade I',   notes: 'Surveillance rapprochee' },
          { idConsultation: 2, dateConsultation: '2026-02-19', diagnostic: 'Controle post-operatoire normal', notes: 'RAS' },
          { idConsultation: 3, dateConsultation: '2026-02-20', diagnostic: 'Infection urinaire post-greffe',  notes: 'Antibiotherapie initiee' },
        ];
      }
    });
  }

  loadRendezvous(): void {
    this.isFetching = true;
    // GET /rendezvous/retrieveRendezvous/{id}  ← ID dans l'URL ✅
    this.http.get<any>(`${this.BASE}/retrieveRendezvous/${this.rendezvousId}`).subscribe({
      next: (data) => {
        this.rendezvous = {
          idRendezvous:   data.idRendezvous,
          dateRendezvous: data.dateRendezvous ? data.dateRendezvous.substring(0, 16) : '',
          etat:           data.etat || '',
        };
        this.selectedConsultationId = data.consultation?.idConsultation ?? null;
        this.selectedPatientId      = data.patient?.idPatient ?? null;
        this.onDateChange(); // applique état effectif (Confirmé/Terminé) selon la date
        this.isFetching = false;
        this.calcProgress();
      },
      error: () => {
        this.showToast('Impossible de charger le rendez-vous', 'toast-error');
        this.isFetching = false;
      }
    });
  }

  calcProgress(): void {
    let filled = 0;
    if (this.rendezvous.dateRendezvous?.trim()) filled++;
    if (this.rendezvous.etat?.trim())           filled++;
    if (this.selectedConsultationId)            filled++;
    this.formProgress = Math.round((filled / 3) * 100);
  }

  getSelectedConsultation(): ConsultationItem | undefined {
    return this.consultationsList.find(c => c.idConsultation === this.selectedConsultationId);
  }

  onConsultationChange(): void { this.calcProgress(); }

  /** Même jour → Confirmé ; jour passé → Terminé (sauf si Annulé). */
  onDateChange(): void {
    const d = this.rendezvous.dateRendezvous;
    if (!d) return;
    const selected = new Date(d);
    const today = new Date();
    const isToday = selected.toDateString() === today.toDateString();
    const isPast = selected < today;
    const etat = (this.rendezvous.etat || '').toUpperCase();
    if (etat !== 'ANNULE') {
      if (isPast) this.rendezvous.etat = 'TERMINE';
      else if (isToday) this.rendezvous.etat = 'CONFIRME';
    }
    this.calcProgress();
  }

  resetForm(): void {
    this.selectedConsultationId = null;
    this.loadRendezvous();
  }

  saveRendezvous(): void {
    if (!this.rendezvousId) return;
    this.isLoading = true;

    let etatToSend = this.rendezvous.etat;
    if ((etatToSend || '').toUpperCase() !== 'ANNULE') {
      const selected = new Date(this.rendezvous.dateRendezvous);
      const today = new Date();
      if (selected.toDateString() === today.toDateString()) etatToSend = 'CONFIRME';
      else if (selected < today) etatToSend = 'TERMINE';
    }

    const dateVal = this.rendezvous.dateRendezvous;
    const dateForBackend = dateVal && dateVal.length <= 10
      ? `${dateVal}T12:00` : dateVal.substring(0, 16);

    const payload = {
      idRendezvous:   this.rendezvousId,
      dateRendezvous: dateForBackend,
      etat:           etatToSend,
      idPatient:      this.selectedPatientId,
      idConsultation: this.selectedConsultationId
    };

    this.http.put<any>(`${this.BASE}/updateRendezvous`, payload).subscribe({
      next: () => {
        this.showToast('Rendez-vous mis a jour avec succes', 'toast-success');
        this.isLoading = false;
        setTimeout(() => this.router.navigate(['/back/consultations']), 1500);
      },
      error: (err) => {
        console.error(err);
        this.showToast('Erreur lors de la mise a jour', 'toast-error');
        this.isLoading = false;
      }
    });
  }

  logout(): void { this.router.navigate(['/login']); }

  showToast(message: string, type = 'toast-success'): void {
    this.toastMessage = message;
    this.toastType    = type;
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 3500);
  }
}