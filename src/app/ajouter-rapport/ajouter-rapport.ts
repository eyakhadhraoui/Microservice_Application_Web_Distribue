import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

export interface Consultation {
  idConsultation: number;
  dateConsultation: string;
  diagnostic: string;
  notes?: string;
  idDossiermedical?: number;
}

export interface RapportDTO {
  dateRapport: string;
  contenu: string;
  recommendations: string;
  idConsultation: number | null;
}

@Component({
  selector: 'app-ajouter-rapport',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './ajouter-rapport.html',
  styleUrls: ['./ajouter-rapport.css']
})
export class AjouterRapportComponent implements OnInit {

  private readonly CONSULTATIONS = `${environment.projetApiRoot}/consultation/retrieveConsultations`;
  private readonly API           = `${environment.projetApiRoot}/rapport/addRapport`;

  isLoading    = false;
  toastVisible = false;
  toastMessage = '';
  toastType    = 'toast-success';

  // Barre de progression
  formProgress = 0;

  // Date du jour (max pour le datepicker)
  today = new Date().toISOString().split('T')[0];

  consultationsList:      Consultation[] = [];
  selectedConsultationId: number | null  = null;
  loadingConsultations    = true;
  consultationsError      = '';

  rapport: RapportDTO = this.emptyRapport();

  private get authHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept':       'application/json',          // ← AJOUT CRUCIAL
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
  }

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadConsultations();
    this.calcProgress();
  }

  loadConsultations(): void {
    this.loadingConsultations = true;
    this.consultationsError   = '';

    this.http
      .get<Consultation[]>(this.CONSULTATIONS, { headers: this.authHeaders })
      .pipe(
        timeout(12000),
        catchError(err => {
          console.error('❌ Consultations:', err?.status ?? err);
          this.loadingConsultations = false;
          this.consultationsError = err?.status === 0
            ? 'Backend (port 8081) inaccessible. Démarrez le microservice projetconsultation.'
            : err?.status === 404
              ? 'Endpoint consultation introuvable. Vérifiez proxy et context-path /projet.'
              : `Erreur ${err?.status ?? '?'} : ${err?.message ?? 'Impossible de charger les consultations'}`;
          return of([]);
        })
      )
      .subscribe(data => {
        const arr = Array.isArray(data) ? data : [];
        this.consultationsList = arr.map((c: any) => ({
          idConsultation:   c.idConsultation ?? c.id,
          dateConsultation: c.dateConsultation ?? c.date ?? '',
          diagnostic:       c.diagnostic ?? '',
          notes:            c.notes ?? '',
          idDossiermedical:  c.idDossiermedical ?? c.idDossiermedical
        }));
        this.loadingConsultations = false;
        this.autoSelectConsultationByDate();
        this.calcProgress();
      });
  }

  getSelectedConsultation(): Consultation | undefined {
    return this.consultationsList.find(c => c.idConsultation === this.selectedConsultationId);
  }

  onConsultationChange(): void {
    // Quand on sélectionne une consultation, remplir automatiquement la date du rapport
    const c = this.getSelectedConsultation();
    if (c?.dateConsultation) {
      this.rapport.dateRapport = (c.dateConsultation || '').slice(0, 10);
    }
    this.calcProgress();
  }

  /** Sélectionne automatiquement la consultation dont la date correspond à la date du rapport. */
  onDateChange(): void {
    this.autoSelectConsultationByDate();
    this.calcProgress();
  }

  private autoSelectConsultationByDate(): void {
    const dateRapport = this.rapport.dateRapport?.trim();
    if (!dateRapport || this.consultationsList.length === 0) return;

    const normalize = (d: string) => (d || '').slice(0, 10);
    const match = this.consultationsList.find(
      c => normalize(c.dateConsultation) === normalize(dateRapport)
    );
    if (match) {
      this.selectedConsultationId = match.idConsultation;
      this.calcProgress();
    }
  }

  /** Insère du texte dans un champ (contenu ou recommendations). */
  appendText(field: 'contenu' | 'recommendations', text: string): void {
    this.rapport[field] = (this.rapport[field] || '') + text;
    this.calcProgress();
  }

  // ─── PROGRESSION ─────────────────────────────────────
  calcProgress(): void {
    let score = 0;
    if (this.rapport.dateRapport)              score += 34;
    if (this.selectedConsultationId)           score += 33;
    if (this.rapport.contenu.length >= 20)     score += 33;
    this.formProgress = score;
  }

  // ─── FORM ─────────────────────────────────────────────
  emptyRapport(): RapportDTO {
    return {
      dateRapport:     new Date().toISOString().split('T')[0],
      contenu:         '',
      recommendations: '',
      idConsultation:  null
    };
  }

  resetForm(): void {
    this.rapport                = this.emptyRapport();
    this.selectedConsultationId = null;
    this.formProgress           = 34; // date pré-remplie
  }

  // ─── SAVE + REDIRECT ──────────────────────────────────
  saveRapport(): void {
    if (!this.rapport.contenu || this.rapport.contenu.trim().length < 20) {
      this.showToast('Le contenu doit contenir au moins 20 caractères', 'toast-error');
      return;
    }
    if (!this.selectedConsultationId) {
      this.showToast('Veuillez sélectionner une consultation', 'toast-error');
      return;
    }
    if (!this.rapport.dateRapport) {
      this.showToast('Veuillez renseigner la date du rapport', 'toast-error');
      return;
    }
  
    this.isLoading = true;
  
    // ✅ payload exact attendu par RapportDTO
    const payload = {
      dateRapport:     this.rapport.dateRapport,        // "2025-03-05" → @JsonFormat gère
      contenu:         this.rapport.contenu.trim(),
      recommendations: this.rapport.recommendations?.trim() || '',
      idConsultation:  this.selectedConsultationId
    };
  
    console.log('📤 Payload rapport :', JSON.stringify(payload, null, 2));
  
    this.http
      .post<any>(this.API, payload, { headers: this.authHeaders })
      .subscribe({
        next: (res) => {
          console.log('✅ Rapport créé :', res);
          this.isLoading = false;
          this.showToast('Rapport créé avec succès ✅', 'toast-success');
          setTimeout(() => this.router.navigate(['/affiche-consultation']), 1800);
        },
        error: (err) => {
          console.error('❌ Erreur POST rapport :', err);
          console.error('❌ Status :', err.status);
          console.error('❌ Body :', err.error);
  
          const msg = err.status === 0
            ? '❌ Serveur inaccessible — vérifiez le backend'
            : err.status === 400
              ? '❌ Données invalides : ' + (err.error?.message || JSON.stringify(err.error))
              : err.status === 404
                ? '❌ Consultation introuvable en base (id=' + this.selectedConsultationId + ')'
                : err.error?.message || '❌ Erreur lors de l\'enregistrement';
  
          this.showToast(msg, 'toast-error');
          this.isLoading = false;
        }
      });
  }

  // ─── TOAST ────────────────────────────────────────────
  showToast(message: string, type = 'toast-success'): void {
    this.toastMessage = message;
    this.toastType    = type;
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 3500);
  }
}