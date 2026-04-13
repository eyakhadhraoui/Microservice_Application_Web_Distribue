import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface RapportUpdate {
  idRapport?: number;
  dateRapport: string;
  contenu: string;
  recommendations: string;
  consultation?: { idConsultation: number } | null;
}

export interface ConsultationItem {
  idConsultation: number;
  dateConsultation: string;
  diagnostic: string;
  notes?: string;
}

@Component({
  selector: 'app-update-rapport',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './update-rapport.html',
  styleUrls: ['./update-rapport.css']
})
export class UpdateRapportComponent implements OnInit {

  private readonly BASE         = `${environment.projetApiRoot}/rapport`;
  private readonly BASE_CONSULT = `${environment.projetApiRoot}/consultation`;

  rapportId: number | null = null;
  isLoading  = false;
  isFetching = true;
  today      = new Date().toISOString().split('T')[0];
  formProgress = 0;

  rapport: RapportUpdate = {
    dateRapport:     '',
    contenu:         '',
    recommendations: ''
  };

  consultationsList:      ConsultationItem[]  = [];
  selectedConsultationId: number | null       = null;

  toastVisible = false;
  toastMessage = '';
  toastType    = 'toast-success';

  constructor(
    private http:   HttpClient,
    private route:  ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.rapportId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadConsultations();
    this.loadRapport();
  }

  loadConsultations(): void {
    this.http.get<ConsultationItem[]>(`${this.BASE_CONSULT}/retrieveConsultations`).subscribe({
      next: (data) => this.consultationsList = Array.isArray(data) ? data : [],
      error: () => this.consultationsList = []
    });
  }

  loadRapport(): void {
    this.isFetching = true;
    this.http.get<any>(`${this.BASE}/retrieveRapport/${this.rapportId}`).subscribe({
      next: (data) => {
        this.rapport = {
          idRapport:       data.idRapport,
          dateRapport:     data.dateRapport ? data.dateRapport.split('T')[0] : '',
          contenu:         data.contenu         || '',
          recommendations: data.recommendations || ''
        };
        this.selectedConsultationId = data.consultation?.idConsultation ?? null;
        this.isFetching = false;
        this.calcProgress();
      },
      error: () => {
        this.showToast('Impossible de charger le rapport', 'toast-error');
        this.isFetching = false;
      }
    });
  }

  calcProgress(): void {
    let filled = 0;
    if (this.rapport.dateRapport?.trim())        filled++;
    if (this.selectedConsultationId)             filled++;
    if (this.rapport.contenu?.trim().length >= 20) filled++;
    this.formProgress = Math.round((filled / 3) * 100);
  }

  getSelectedConsultation(): ConsultationItem | undefined {
    return this.consultationsList.find(c => c.idConsultation === this.selectedConsultationId);
  }

  onConsultationChange(): void { this.calcProgress(); }

  resetForm(): void {
    this.selectedConsultationId = null;
    this.loadRapport();
  }

  saveRapport(): void {
    if (!this.rapportId) return;
    this.isLoading = true;
    const payload = {
      idRapport:       this.rapportId,
      dateRapport:     this.rapport.dateRapport ? (this.rapport.dateRapport.length <= 10 ? `${this.rapport.dateRapport}T12:00:00` : this.rapport.dateRapport) : '',
      contenu:         this.rapport.contenu,
      recommendations: this.rapport.recommendations || '',
      idConsultation:  this.selectedConsultationId
    };
    // Adaptez l'URL selon votre controller backend
    this.http.put<any>(`${this.BASE}/updateRapport`, payload).subscribe({
      next: () => {
        this.showToast('Rapport mis a jour avec succes', 'toast-success');
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