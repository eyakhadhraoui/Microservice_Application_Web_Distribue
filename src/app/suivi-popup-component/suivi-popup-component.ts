import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { NotificationService } from '../services/notification.service';

interface SuiviMaladie {
  idDossier: number;
  dateSuivi: string;
  symptomes: string;
  traitement: string;
  tensionArterielle: string;
  creatinine: number;
  poids: number;
  temperature: number;
  observations: string;
}
interface DossierMedical {
  idDossierMedical: number;
  idPatient: number;
  nomPatient: string;
  idMedecin: number;
  nomMedecin: string;
  dateCreation: string; 
  typeDossier: string;
  notes: string;
}



@Component({
  selector: 'app-suivi-popup',
  standalone: false,
  templateUrl: './suivi-popup-component.html',
  styleUrls: ['./suivi-popup-component.css']
})
export class SuiviPopupComponent implements OnInit {

  @Input() dossier: DossierMedical | null = null;
  @Output() close = new EventEmitter<void>();

  constructor(private notification: NotificationService) {}

  suiviForm: SuiviMaladie = {
    idDossier: 0,
    dateSuivi: '',
    symptomes: '',
    traitement: '',
    tensionArterielle: '',
    creatinine: 0,
    poids: 0,
    temperature: 0,
    observations: ''
  };

  ngOnInit() {
    if (this.dossier) {
      this.suiviForm.idDossier = this.dossier.idDossierMedical;
      this.suiviForm.dateSuivi = new Date().toISOString().split('T')[0];
    }
  }

  closePopup() {
    this.close.emit();
  }

  closeOnOverlay(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('popup-overlay')) {
      this.closePopup();
    }
  }

  onSubmit() {
    console.log('Formulaire de suivi soumis:', this.suiviForm);

    this.notification.success(`Follow-up recorded successfully for ${this.dossier?.nomPatient}`);
    this.closePopup();
  }

  isFormValid(): boolean {
    return !!(
      this.suiviForm.dateSuivi &&
      this.suiviForm.symptomes &&
      this.suiviForm.traitement &&
      this.suiviForm.tensionArterielle &&
      this.suiviForm.creatinine > 0 &&
      this.suiviForm.poids > 0 &&
      this.suiviForm.temperature > 0
    );
  }
}
