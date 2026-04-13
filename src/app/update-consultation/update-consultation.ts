import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environments/environment';
export interface ConsultationUpdate {
  idConsultation?: number;
  dateConsultation: string;
  diagnostic: string;
  notes: string;
  idDossiermedical: number | null;
}

export interface Rendezvous {
  idRendezvous: number;
  dateRendezvous: string;
  etat: string;
  patient?: string;
  medecin?: string;
}

@Component({
  selector: 'app-update-consultation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './update-consultation.html',
  styleUrls: ['./update-consultation.css']
})
export class UpdateConsultationComponent implements OnInit {

  private readonly BASE     = `${environment.projetApiRoot}/consultation`;
  private readonly BASE_RDV = `${environment.projetApiRoot}/rendezvous`;

  consultationId: number | null = null;
  isLoading    = false;
  isFetching   = true;
  today        = new Date().toISOString().split('T')[0];
  formProgress = 0;

  consultation: ConsultationUpdate = {
    dateConsultation: '',
    diagnostic:       '',
    notes:            '',
    idDossiermedical: null
  };

  rendezvousList:       Rendezvous[]  = [];
  selectedRendezvousId: number | null = null;

  toastVisible = false;
  toastMessage = '';
  toastType    = 'toast-success';

  constructor(
    private http:   HttpClient,
    private route:  ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.consultationId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadRendezvous();
    this.loadConsultation();
  }

  loadRendezvous(): void {
    this.http.get<Rendezvous[]>(`${this.BASE_RDV}/retrieveRendezvous`).subscribe({
      next:  (data) => this.rendezvousList = data,
      error: () => {
        this.rendezvousList = [
          { idRendezvous: 1, dateRendezvous: '2026-02-25T10:30', etat: 'PLANIFIE', patient: 'Patient A', medecin: 'Dr. Martin'  },
          { idRendezvous: 2, dateRendezvous: '2026-02-20T09:00', etat: 'CONFIRME', patient: 'Patient B', medecin: 'Dr. Dupont'  },
          { idRendezvous: 3, dateRendezvous: '2026-02-15T14:00', etat: 'TERMINE',  patient: 'Patient C', medecin: 'Dr. Bernard' },
        ];
      }
    });
  }

  loadConsultation(): void {
    this.isFetching = true;
    this.http.get<ConsultationUpdate>(`${this.BASE}/retrieveConsultation/${this.consultationId}`).subscribe({
      next: (data) => {
        this.consultation = {
          idConsultation:   data.idConsultation,
          dateConsultation: data.dateConsultation ? data.dateConsultation.split('T')[0] : '',
          diagnostic:       data.diagnostic  || '',
          notes:            data.notes       || '',
          idDossiermedical: data.idDossiermedical ?? null
        };
        this.isFetching = false;
        this.calcProgress();
      },
      error: () => {
        this.showToast('Impossible de charger la consultation ❌', 'toast-error');
        this.isFetching = false;
      }
    });
  }

  calcProgress(): void {
    let filled = 0;
    if (this.consultation.dateConsultation?.trim())        filled++;
    if (this.consultation.diagnostic?.trim().length >= 5) filled++;
    if (this.consultation.idDossiermedical)               filled++;
    if (this.selectedRendezvousId)                        filled++;
    this.formProgress = Math.round((filled / 4) * 100);
  }

  getSelectedRdv(): Rendezvous | undefined {
    return this.rendezvousList.find(r => r.idRendezvous === this.selectedRendezvousId);
  }

  onRdvChange(): void { this.calcProgress(); }

  resetForm(): void {
    this.loadConsultation();
    this.selectedRendezvousId = null;
  }

  saveConsultation(): void {
    if (!this.consultationId) return;
    this.isLoading = true;
    this.http.put<ConsultationUpdate>(
      `${this.BASE}/updateConsultation/${this.consultationId}`,
      this.consultation
    ).subscribe({
      next: () => {
        this.showToast('Consultation mise à jour avec succès ✅', 'toast-success');
        this.isLoading = false;
        setTimeout(() => this.router.navigate(['/back/consultations']), 1500);
      },
      error: (err) => {
        console.error(err);
        this.showToast('Erreur lors de la mise à jour ❌', 'toast-error');
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