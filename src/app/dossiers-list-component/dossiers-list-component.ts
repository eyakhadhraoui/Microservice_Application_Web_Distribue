import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DossierService, DossierMedical } from '../services/dossier';
import { PatientService, Patient } from '../services/patient.service';
import { MedecinService, Medecin } from '../services/medecin.service';
import { SuiviService, Suivi } from '../services/suivi';
import { ImageMedicaleService, ImageMedicale } from '../services/image-medicale';
import { ResultatLaboratoireService, ResultatLaboratoire, formatValeurResultat } from '../services/resultat-laboratoire';
import { RapportBiService, RapportBi } from '../services/rapport-bi';
import { NotesInternesService, NoteInterne } from '../services/notes-internes.service';
import { MessageService, Message, TypeExpediteur } from '../services/message.service';
import { NgForm } from '@angular/forms';
import { NotificationService } from '../services/notification.service';
import { ConfirmService } from '../services/confirm.service';

@Component({
  selector: 'app-dossiers-list',
  templateUrl: './dossiers-list-component.html',
  styleUrls: ['./dossiers-list-component.css'],
  standalone: false
})
export class DossiersListComponent implements OnInit {

  dossiers: DossierMedical[] = [];
  suivis: Suivi[] = [];
  images: ImageMedicale[] = [];
  /** Liste des patients (pour créer un dossier en choisissant le n° patient). */
  patients: Patient[] = [];
  loadingPatients = false;
  /** Médecin connecté (pré-rempli à la création de dossier). */
  currentMedecin: Medecin | null = null;

  /** Filtres backoffice */
  searchText = '';
  filterDateFrom = '';
  filterDateTo = '';
  filterDiagnostic = '';
  
  loading = false;
  error = '';

  dossierForm!: FormGroup;
  suiviForm!: FormGroup;
  imageForm!: FormGroup;

  showCreateDossierPopup = false;
  showSuiviPopup = false;
  showSuivisListPopup = false;
  showImagePopup = false;
  showTestsLabPopup = false;
  showRapportFormPopup = false;
  selectedDossierForTests: DossierMedical | null = null;
  testsLabList: ResultatLaboratoire[] = [];
  loadingTestsLab = false;
  selectedBilanForRapport: ResultatLaboratoire | null = null;
  rapportSubmitting = false;
  rapportError = '';
  rapportsByBilanId: { [id: number]: RapportBi[] } = {};
  rapportDefaultDate = '';

  /** Notes internes (médecin uniquement, par dossier) */
  notesByDossierId: { [id: number]: NoteInterne[] } = {};
  newNoteInterneText = '';
  loadingNotes = false;
  addingNote = false;

  /** Messagerie médecin–patient (par dossier) */
  messagesByDossierId: { [id: number]: Message[] } = {};
  newMessageText = '';
  loadingMessages = false;
  sendingMessage = false;

  /** Signature électronique (pad canvas pour rapport) */
  @ViewChild('signatureCanvasRef') signatureCanvasRef!: ElementRef<HTMLCanvasElement>;
  private signatureDrawing = false;
  private signatureLastX = 0;
  private signatureLastY = 0;

  editMode = false;
  submitting = false;

  /** Dossier auquel on ajoute une image (liée au dossier médical, pas au suivi) */
  selectedDossierForImage: DossierMedical | null = null;

  selectedDossier: DossierMedical | null = null;
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  /** Fichier PDF ou image attaché au suivi en cours de création */
  selectedSuiviFile: File | null = null;
  selectedSuiviFileName = '';

  /** Scan OCR : fichier sélectionné pour extraire le texte vers les notes */
  ocrSuiviFile: File | null = null;
  ocrSuiviFileName = '';
  ocrLoading = false;

  /** ID du dossier sélectionné (pour le template, évite null/undefined). */
  get selectedDossierId(): number | null {
    return this.selectedDossier?.idDossierMedical ?? null;
  }

  /** Dossiers filtrés par recherche, date et diagnostic. */
  get filteredDossiers(): DossierMedical[] {
    let list = this.dossiers;
    const q = (this.searchText || '').trim().toLowerCase();
    if (q) {
      list = list.filter(d => {
        const idD = String(d.idDossierMedical ?? '');
        const idP = String(d.idPatient ?? '');
        const idM = String(d.idMedecin ?? '');
        const notes = (d.notes ?? '').toLowerCase();
        const diag = (d.diagnostic ?? '').toLowerCase();
        return idD.toLowerCase().includes(q) || idP.includes(q) || idM.includes(q)
          || notes.includes(q) || diag.includes(q);
      });
    }
    if (this.filterDateFrom) {
      const from = this.filterDateFrom.slice(0, 10);
      list = list.filter(d => (d.dateCreation || '').slice(0, 10) >= from);
    }
    if (this.filterDateTo) {
      const to = this.filterDateTo.slice(0, 10);
      list = list.filter(d => (d.dateCreation || '').slice(0, 10) <= to);
    }
    if (this.filterDiagnostic) {
      list = list.filter(d => (d.diagnostic || '') === this.filterDiagnostic);
    }
    return list;
  }

  @ViewChild('fileInputRef') fileInputRef!: ElementRef<HTMLInputElement>;

  /** Valeurs exactes de l'enum Diagnostic du backend (sans accents). */
  diagnostics: { value: string; libelle: string }[] = [
    { value: 'INFECTION_URINAIRE', libelle: 'Infection urinaire' },
    { value: 'PYELONEPHRITE', libelle: 'Pyélonéphrite aiguë' },
    { value: 'CYSTITE', libelle: 'Cystite' },
    { value: 'REFLUX_VESICO_URETERAL', libelle: 'Reflux vésico-urétéral' },
    { value: 'HYDRONEPHROSE', libelle: 'Hydronéphrose' },
    { value: 'SYNDROME_NEPHROTIQUE', libelle: 'Syndrome néphrotique' },
    { value: 'SYNDROME_NEPHROTIQUE_CORTICOSENSIBLE', libelle: 'Syndrome néphrotique corticosensible' },
    { value: 'SYNDROME_NEPHROTIQUE_CORTICORESISTANT', libelle: 'Syndrome néphrotique corticorésistant' },
    { value: 'GLOMERULONEPHRITE_AIGUE', libelle: 'Glomérulonéphrite aiguë post-infectieuse' },
    { value: 'GLOMERULONEPHRITE_CHRONIQUE', libelle: 'Glomérulonéphrite chronique' },
    { value: 'LUPUS_NEPHRITE', libelle: 'Lupus néphrite' },
    { value: 'SYNDROME_HEMOLYTIQUE_UREMIQUE', libelle: 'Syndrome hémolytique et urémique (SHU)' },
    { value: 'MALADIE_DE_BERGER', libelle: 'Maladie de Berger (néphropathie à IgA)' },
    { value: 'ACIDOSE_TUBULAIRE_RENALE', libelle: 'Acidose tubulaire rénale' },
    { value: 'INSUFFISANCE_RENALE_AIGUE', libelle: 'Insuffisance rénale aiguë' },
    { value: 'INSUFFISANCE_RENALE_CHRONIQUE', libelle: 'Insuffisance rénale chronique' },
    { value: 'REJET_DE_GREFFE', libelle: 'Rejet de greffe rénale' },
    { value: 'POST_TRANSPLANTATION_RENALE', libelle: 'Post-transplantation rénale' },
    { value: 'AUTRE', libelle: 'Other diagnosis' }
  ];

  resultat = [
    { value: 'EN_COURS', libelle: 'Under treatment' },
    { value: 'STABLE', libelle: 'Stable' },
    { value: 'AMELIORATION', libelle: 'Improvement' },
    { value: 'DETERIORATION', libelle: 'Deterioration' },
    { value: 'REMISSION', libelle: 'Remission' },
    { value: 'RECHUTE', libelle: 'Relapse' },
    { value: 'GUERISON', libelle: 'Recovery' },
    { value: 'SOUS_SURVEILLANCE', libelle: 'Under surveillance' },
    { value: 'HOSPITALISATION_REQUISE', libelle: 'Hospitalization required' },
    { value: 'URGENCE', libelle: 'Emergency' },
    { value: 'TRAITEMENT_MODIFIE', libelle: 'Treatment modified' },
    { value: 'COMPLIANCE_FAIBLE', libelle: 'Low treatment compliance' },
    { value: 'COMPLIANCE_BONNE', libelle: 'Good compliance' },
    { value: 'ATTENTE_RESULTATS', libelle: 'Awaiting results' },
    { value: 'CONSULTATION_SPECIALISEE_REQUISE', libelle: 'Specialist consultation required' },
    { value: 'GREFFE_EN_ATTENTE', libelle: 'Awaiting transplant' },
    { value: 'POST_OPERATOIRE', libelle: 'Post-operative' },
    { value: 'SUIVI_TERMINE', libelle: 'Follow-up completed' },
    { value: 'PERDU_DE_VUE', libelle: 'Lost to follow-up' },
    { value: 'DECES', libelle: 'Deceased' }
  ];

  // Types d'images correspondant à l'enum backend
  typesImage = [
    { value: 'ECHOGRAPHIE_RENALE', libelle: 'Renal ultrasound' },
    { value: 'ECHOGRAPHIE_VESICALE', libelle: 'Bladder ultrasound' },
    { value: 'ECHOGRAPHIE_DOPPLER_RENAL', libelle: 'Renal Doppler ultrasound' },
    { value: 'SCANNER_ABDOMINAL', libelle: 'Abdominal CT scan' },
    { value: 'SCANNER_RENAL', libelle: 'Renal CT scan' },
    { value: 'URO_SCANNER', libelle: 'Uro-CT scan' },
    { value: 'IRM_RENALE', libelle: 'Renal MRI' },
    { value: 'IRM_ABDOMINALE', libelle: 'Abdominal MRI' },
    { value: 'URO_IRM', libelle: 'Uro-MRI' },
    { value: 'RADIOGRAPHIE_ABDOMINALE', libelle: 'Abdominal X-ray' },
    { value: 'SCINTIGRAPHIE_RENALE_STATIQUE', libelle: 'Static renal scintigraphy (DMSA)' },
    { value: 'SCINTIGRAPHIE_RENALE_DYNAMIQUE', libelle: 'Dynamic renal scintigraphy (MAG3/DTPA)' },
    { value: 'CYSTOGRAPHIE_RETRO_MICTIONNELLE', libelle: 'Voiding cystourethrogram' },
    { value: 'PHOTO_CLINIQUE', libelle: 'Clinical photo' },
    { value: 'AUTRE', libelle: 'Other image type' }
  ];

  constructor(
    private dossierService: DossierService,
    private patientService: PatientService,
    private medecinService: MedecinService,
    private suiviService: SuiviService,
    private imageMedicaleService: ImageMedicaleService,
    private resultatLaboratoireService: ResultatLaboratoireService,
    private rapportBiService: RapportBiService,
    private notesInternesService: NotesInternesService,
    private messageService: MessageService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private notification: NotificationService,
    private confirmService: ConfirmService,
  ) {}

  ngOnInit() {
    try {
      this.initForms();
      this.loadDossiers();
      this.loadPatients();
    } catch (e) {
      console.error('Erreur init DossiersListComponent:', e);
      this.loading = false;
      this.error = 'Initialization error. Check the console.';
      this.cdr.detectChanges();
    }
  }

  initForms() {
    this.dossierForm = this.fb.group({
      idPatient: [null as number | null, [Validators.required, Validators.min(1)]],
      dateCreation: [this.getCurrentDate(), Validators.required],
      idMedecin: [1, [Validators.required, Validators.min(1)]],
      diagnostic: ['', [Validators.required, Validators.minLength(10)]],
      notes: ['', [Validators.maxLength(2000)]]
    });

    this.suiviForm = this.fb.group({
      dateSuivi: [this.getCurrentDate(), Validators.required],
      notes: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(2000)]],
      objectif: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(500)]],
      resultat: ['', Validators.required]
    });

    this.imageForm = this.fb.group({
      typeImage: ['', Validators.required],
      dateCapture: [this.getCurrentDate(), Validators.required],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  loadDossiers() {
    this.loading = true;
    this.error = '';
    
    this.dossierService.getAllDossiers().subscribe({
      next: (data) => {
        console.log('✅ Dossiers reçus dans le composant:', data);
        this.dossiers = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Erreur dans le composant:', err);
        this.error = err?.message || 'Unable to load records. Ensure the backend is running (port 8089).';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  clearFilters() {
    this.searchText = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterDiagnostic = '';
    this.cdr.detectChanges();
  }

  // ========================================
  // GESTION DES DOSSIERS
  // ========================================

  openCreateDossierPopup() {
    this.editMode = false;
    this.selectedDossier = null;
    this.currentMedecin = null;
    const firstId = this.patients.length > 0 ? this.patients[0].idPatient : null;
    this.dossierForm.reset({
      idPatient: firstId,
      idMedecin: null,
      dateCreation: this.getCurrentDate(),
      diagnostic: 'AUTRE',
      notes: ''
    });
    this.showCreateDossierPopup = true;
    this.medecinService.getMe().subscribe({
      next: (m) => {
        this.currentMedecin = m;
        this.dossierForm.patchValue({ idMedecin: m.idMedecin });
        this.cdr.detectChanges();
      },
      error: () => {
        this.currentMedecin = null;
        this.cdr.detectChanges();
      }
    });
  }

  loadPatients() {
    this.loadingPatients = true;
    this.patientService.getAll().subscribe({
      next: (data) => {
        this.patients = data || [];
        this.loadingPatients = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.patients = [];
        this.loadingPatients = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeCreateDossierPopup() {
    this.showCreateDossierPopup = false;
  }

  submitCreateDossier() {
    if (this.dossierForm.invalid) {
      Object.keys(this.dossierForm.controls).forEach(key => {
        this.dossierForm.get(key)?.markAsTouched();
      });
      this.notification.error('Please fill in all required fields');
      return;
    }

    this.submitting = true;
    const data = { ...this.dossierForm.value };
    data.idPatient = Number(data.idPatient);
    data.idMedecin = Number(data.idMedecin);

    console.log('📝 Données du formulaire avant envoi:', data);
    console.log('📝 Diagnostic:', data.diagnostic, 'Type:', typeof data.diagnostic);

    if (this.editMode && this.selectedDossier?.idDossierMedical) {
      this.dossierService.updateDossier(this.selectedDossier.idDossierMedical, data).subscribe({
        next: () => {
          this.notification.success('Record updated successfully!');
          this.loadDossiers();
          this.closeCreateDossierPopup();
          this.submitting = false;
        },
        error: (err) => {
          this.notification.error('Error: ' + err.message);
          this.submitting = false;
        }
      });
    } else {
      this.dossierService.createDossier(data).subscribe({
        next: () => {
          this.notification.success('Record created successfully!');
          this.loadDossiers();
          this.closeCreateDossierPopup();
          this.submitting = false;
        },
        error: (err) => {
          this.notification.error('Error: ' + err.message);
          this.submitting = false;
        }
      });
    }
  }

  editDossier(dossier: DossierMedical) {
    this.editMode = true;
    this.selectedDossier = dossier;
    this.currentMedecin = null;
    this.dossierForm.patchValue(dossier);
    this.showCreateDossierPopup = true;
  }

  confirmDeleteDossier(dossier: DossierMedical) {
    this.confirmService.confirm(`Delete record ${dossier.idDossierMedical}?`, { title: 'Delete record' }).then((ok) => {
      if (!ok) return;
      this.dossierService.deleteDossier(dossier.idDossierMedical!).subscribe({
        next: () => {
          this.notification.success('Record deleted.');
          this.loadDossiers();
        },
        error: (err) => {
          this.notification.error('Error: ' + err.message);
        }
      });
    });
  }

  // ========================================
  // GESTION DES SUIVIS
  // ========================================

  openSuiviPopup(dossier: DossierMedical) {
    this.selectedDossier = dossier;
    this.selectedSuiviFile = null;
    this.selectedSuiviFileName = '';
    this.ocrSuiviFile = null;
    this.ocrSuiviFileName = '';
    this.ocrLoading = false;
    this.suiviForm.reset({
      dateSuivi: this.getCurrentDate(),
      notes: '',
      objectif: '',
      resultat: 'EN_COURS'
    });
    this.showSuiviPopup = true;
  }

  onSuiviFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const name = file.name.toLowerCase();
      const ok = name.endsWith('.pdf') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.gif') || name.endsWith('.webp');
      if (ok) {
        this.selectedSuiviFile = file;
        this.selectedSuiviFileName = file.name;
      } else {
        this.notification.error('Accepted format: PDF or image (jpg, png, gif, webp).');
        input.value = '';
      }
    } else {
      this.selectedSuiviFile = null;
      this.selectedSuiviFileName = '';
    }
    this.cdr.detectChanges();
  }

  clearSuiviFile(): void {
    this.selectedSuiviFile = null;
    this.selectedSuiviFileName = '';
    const input = document.getElementById('suivi-file-input') as HTMLInputElement;
    if (input) input.value = '';
    this.cdr.detectChanges();
  }

  onOcrFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const name = file.name.toLowerCase();
      const ok = name.endsWith('.pdf') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.gif') || name.endsWith('.bmp') || name.endsWith('.tiff') || name.endsWith('.tif') || name.endsWith('.webp');
      if (ok) {
        this.ocrSuiviFile = file;
        this.ocrSuiviFileName = file.name;
      } else {
        this.notification.error('Accepted format for OCR: PDF or image (jpg, png, gif, bmp, tiff, webp).');
        input.value = '';
      }
    } else {
      this.ocrSuiviFile = null;
      this.ocrSuiviFileName = '';
    }
    this.cdr.detectChanges();
  }

  clearOcrFile(): void {
    this.ocrSuiviFile = null;
    this.ocrSuiviFileName = '';
    const input = document.getElementById('suivi-ocr-input') as HTMLInputElement;
    if (input) input.value = '';
    this.cdr.detectChanges();
  }

  /** Lance l'OCR sur le fichier sélectionné et écrit le texte extrait dans les notes. */
  runOcr(): void {
    if (!this.ocrSuiviFile) return;
    this.ocrLoading = true;
    this.suiviService.ocrExtractText(this.ocrSuiviFile).subscribe({
      next: (res) => {
        const text = (res?.text ?? '').trim();
        const errorMsg = res?.error;
        this.suiviForm.patchValue({ notes: text });
        this.ocrLoading = false;
        this.clearOcrFile();
        this.cdr.detectChanges();
        if (errorMsg) {
          this.notification.error('OCR : ' + errorMsg);
        } else if (text) {
          this.notification.success('Text extracted and inserted into notes.');
        } else {
          this.notification.info('No text detected in the document. The file may be unreadable or contain no text.');
        }
      },
      error: (err) => {
        this.ocrLoading = false;
        this.cdr.detectChanges();
        this.notification.error('OCR error: ' + (err?.message ?? 'unable to extract text'));
      }
    });
  }

  closeSuiviPopup() {
    this.showSuiviPopup = false;
  }

  submitSuivi() {
    if (this.suiviForm.invalid || !this.selectedDossier) {
      Object.keys(this.suiviForm.controls).forEach(key => this.suiviForm.get(key)?.markAsTouched());
      return;
    }

    this.submitting = true;
    const suiviData = { ...this.suiviForm.value };

    const doCreate = (cheminPieceJointe?: string) => {
      if (cheminPieceJointe) suiviData.cheminPieceJointe = cheminPieceJointe;
      this.suiviService.createSuivi(this.selectedDossier!.idDossierMedical!, suiviData).subscribe({
        next: () => {
          this.notification.success('Follow-up added successfully!');
          this.loadDossiers();
          this.closeSuiviPopup();
          this.submitting = false;
        },
        error: (err) => {
          this.notification.error('Error: ' + err.message);
          this.submitting = false;
        }
      });
    };

    if (this.selectedSuiviFile) {
      this.suiviService.uploadPieceJointe(this.selectedSuiviFile).subscribe({
        next: (res) => {
          if (res?.path) doCreate(res.path);
          else {
            this.notification.error('File upload failed.');
            this.submitting = false;
          }
        },
        error: (err) => {
          this.notification.error('Upload error: ' + err.message);
          this.submitting = false;
        }
      });
    } else {
      doCreate();
    }
  }

  openSuivisListPopup(dossier: DossierMedical) {
    this.selectedDossier = dossier;
    this.suivis = [];
    this.error = '';
    this.loading = true;
    this.newNoteInterneText = '';
    this.newMessageText = '';
    this.showSuivisListPopup = true;
    this.loadSuivis(dossier.idDossierMedical!);
    this.loadNotesInternes(dossier.idDossierMedical!);
    this.loadMessagesForDossier(dossier.idDossierMedical!);
    if (!this.currentMedecin) {
      this.medecinService.getMe().subscribe({ next: (m) => { this.currentMedecin = m; this.cdr.detectChanges(); }, error: () => {} });
    }
  }

  loadNotesInternes(idDossierMedical: number) {
    this.loadingNotes = true;
    this.notesInternesService.getByDossier(idDossierMedical).subscribe({
      next: (list) => { this.notesByDossierId[idDossierMedical] = list || []; this.loadingNotes = false; this.cdr.detectChanges(); },
      error: () => { this.notesByDossierId[idDossierMedical] = []; this.loadingNotes = false; this.cdr.detectChanges(); }
    });
  }

  addNoteInterne() {
    const id = this.selectedDossier?.idDossierMedical;
    const text = (this.newNoteInterneText || '').trim();
    if (!id || !text) return;
    this.addingNote = true;
    this.notesInternesService.create({ idDossierMedical: id, contenu: text }).subscribe({
      next: () => {
        this.newNoteInterneText = '';
        this.loadNotesInternes(id);
        this.addingNote = false;
        this.cdr.detectChanges();
      },
      error: (err) => { this.addingNote = false; this.notification.error(err?.message || 'Error'); this.cdr.detectChanges(); }
    });
  }

  deleteNoteInterne(note: NoteInterne) {
    this.confirmService.confirm('Delete this internal note?', { title: 'Delete note' }).then((ok) => {
      if (!ok || !note.idNoteInterne) return;
      this.notesInternesService.delete(note.idNoteInterne).subscribe({
        next: () => { if (this.selectedDossier?.idDossierMedical) this.loadNotesInternes(this.selectedDossier.idDossierMedical!); this.cdr.detectChanges(); },
        error: (err) => this.notification.error(err?.message || 'Erreur')
      });
    });
  }

  loadMessagesForDossier(idDossierMedical: number) {
    this.loadingMessages = true;
    this.messageService.getByDossier(idDossierMedical).subscribe({
      next: (list) => { this.messagesByDossierId[idDossierMedical] = list || []; this.loadingMessages = false; this.cdr.detectChanges(); },
      error: () => { this.messagesByDossierId[idDossierMedical] = []; this.loadingMessages = false; this.cdr.detectChanges(); }
    });
  }

  sendMessage() {
    const id = this.selectedDossier?.idDossierMedical;
    const text = (this.newMessageText || '').trim();
    if (!id || !text) return;
    this.sendingMessage = true;
    this.messageService.send({
      idDossierMedical: id,
      typeExpediteur: 'MEDECIN' as TypeExpediteur,
      contenu: text
    }).subscribe({
      next: () => {
        this.newMessageText = '';
        this.loadMessagesForDossier(id);
        this.sendingMessage = false;
        this.cdr.detectChanges();
      },
      error: (err) => { this.sendingMessage = false; this.notification.error(err?.message || 'Send error'); this.cdr.detectChanges(); }
    });
  }

  closeSuivisListPopup() {
    this.showSuivisListPopup = false;
  }

  deleteSuivi(suivi: Suivi) {
    if (!suivi.idSuivi || !this.selectedDossier) return;
    this.confirmService.confirm('Delete this follow-up?', { title: 'Delete follow-up' }).then((ok) => {
      if (!ok || suivi.idSuivi == null) return;
      this.suiviService.deleteSuivi(suivi.idSuivi).subscribe({
        next: () => {
          this.loadSuivis(this.selectedDossier!.idDossierMedical!);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.notification.error(err?.message || 'Error deleting follow-up.');
        }
      });
    });
  }

  // ========================================
  // TESTS LABORATOIRE (bilans) + RAPPORT
  // ========================================

  openTestsLabPopup(dossier: DossierMedical) {
    this.selectedDossierForTests = dossier;
    this.testsLabList = [];
    this.rapportsByBilanId = {};
    this.loadingTestsLab = true;
    this.showTestsLabPopup = true;
    this.resultatLaboratoireService.getByDossier(dossier.idDossierMedical!).subscribe({
      next: (data) => {
        this.testsLabList = data || [];
        this.loadingTestsLab = false;
        this.testsLabList.forEach(r => {
          if (r.idResultatLaboratoire) this.loadRapportsForBilanInBack(r.idResultatLaboratoire);
        });
        this.cdr.detectChanges();
      },
      error: () => {
        this.testsLabList = [];
        this.loadingTestsLab = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadRapportsForBilanInBack(idResultat: number) {
    this.rapportBiService.getByBilan(idResultat).subscribe({
      next: (data) => { this.rapportsByBilanId[idResultat] = data || []; this.cdr.detectChanges(); },
      error: () => { this.rapportsByBilanId[idResultat] = []; }
    });
  }

  closeTestsLabPopup() {
    this.showTestsLabPopup = false;
    this.selectedDossierForTests = null;
    this.testsLabList = [];
    this.rapportsByBilanId = {};
  }

  openRapportForm(bilan: ResultatLaboratoire) {
    this.selectedBilanForRapport = bilan;
    this.rapportDefaultDate = this.getCurrentDate();
    this.rapportError = '';
    this.showRapportFormPopup = true;
    setTimeout(() => this.initSignaturePad(), 150);
  }

  closeRapportForm() {
    this.showRapportFormPopup = false;
    this.selectedBilanForRapport = null;
    this.rapportError = '';
  }

  initSignaturePad() {
    const canvas = this.signatureCanvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }

  clearSignature() {
    this.initSignaturePad();
    this.cdr.detectChanges();
  }

  getSignatureBase64(): string | null {
    const canvas = this.signatureCanvasRef?.nativeElement;
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
  }

  onSignatureStart(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    this.signatureDrawing = true;
    const coords = this.getSignatureCoords(e);
    this.signatureLastX = coords.x;
    this.signatureLastY = coords.y;
  }

  onSignatureMove(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    if (!this.signatureDrawing) return;
    const canvas = this.signatureCanvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const coords = this.getSignatureCoords(e);
    ctx.beginPath();
    ctx.moveTo(this.signatureLastX, this.signatureLastY);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    this.signatureLastX = coords.x;
    this.signatureLastY = coords.y;
  }

  onSignatureEnd(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    this.signatureDrawing = false;
  }

  private getSignatureCoords(e: MouseEvent | TouchEvent): { x: number; y: number } {
    const canvas = this.signatureCanvasRef?.nativeElement;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e instanceof MouseEvent) {
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    const t = (e as TouchEvent).touches[0] || (e as TouchEvent).changedTouches[0];
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }

  submitRapport(form: NgForm) {
    if (form.invalid || !this.selectedBilanForRapport?.idResultatLaboratoire || !this.selectedDossierForTests?.idDossierMedical) {
      Object.keys(form.controls).forEach(k => form.controls[k]?.markAsTouched());
      if (form.invalid) this.rapportError = 'Please fill required fields (report date).';
      return;
    }
    this.rapportError = '';
    const v = form.value;
    const signatureBase64 = this.getSignatureBase64();
    const nomMedecin = this.selectedDossierForTests?.medecinNom
      || (this.currentMedecin ? `${(this.currentMedecin.prenom || '')} ${(this.currentMedecin.nom || '')}`.trim() : undefined);
    const dto: RapportBi = {
      idResultatLaboratoire: this.selectedBilanForRapport.idResultatLaboratoire!,
      idDossierMedical: this.selectedDossierForTests!.idDossierMedical!,
      dateRapport: v.dateRapport || this.getCurrentDate(),
      contenu: v.contenu?.trim() || undefined,
      conclusion: v.conclusion?.trim() || undefined,
      recommandations: v.recommandations?.trim() || undefined,
      signatureBase64: signatureBase64 || undefined,
      dateSignature: signatureBase64 ? new Date().toISOString() : undefined,
      nomMedecin: nomMedecin || undefined
    };
    this.rapportSubmitting = true;
    this.rapportError = '';
    this.rapportBiService.create(dto).subscribe({
      next: (created) => {
        this.rapportSubmitting = false;
        const idBilan = this.selectedBilanForRapport!.idResultatLaboratoire!;
        const list = this.rapportsByBilanId[idBilan] || [];
        const without = list.filter(r => r.idRapportBilan !== created.idRapportBilan);
        this.rapportsByBilanId[idBilan] = [created, ...without];
        this.closeRapportForm();
        form.reset();
        this.cdr.detectChanges();
        this.notification.success('Report created.');
      },
      error: (err) => {
        this.rapportSubmitting = false;
        this.rapportError = err?.message ?? err?.error?.message ?? 'Erreur.';
        this.cdr.detectChanges();
      }
    });
  }

  /** Enregistre le rapport en PDF (paragraphes : contenu, conclusion, recommandations). */
  exportRapportPdf(rap: RapportBi) {
    this.rapportBiService.exportRapportAsPdf(rap, {
      patientName: this.selectedDossierForTests?.patientNom
    });
  }

  /** Ouvre le PDF du rapport de bilan dans un nouvel onglet. */
  openBilanPdf(idRapportBilan: number) {
    this.rapportBiService.getPdf(idRapportBilan).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      },
      error: (err) => this.notification.error(err?.message || 'PDF unavailable')
    });
  }

  formatDateBack(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('fr-FR');
  }

  // ========================================
  // GESTION DES IMAGES MÉDICALES
  // ========================================

  /** Ouvre le popup d'ajout d'image pour le dossier donné (image liée au dossier médical). */
  openImagePopupFromDossier(dossier: DossierMedical) {
    this.selectedDossierForImage = dossier;
    this.selectedFile = null;
    this.imagePreview = null;
    this.imageForm.reset({
      typeImage: 'ECHOGRAPHIE_RENALE',
      dateCapture: this.getCurrentDate()
    });
    this.showImagePopup = true;
  }

  /** Ouvre le popup d'ajout d'image depuis la section "Images du dossier" (dossier déjà sélectionné). */
  openImagePopupFromDossierContext() {
    if (this.selectedDossier) {
      this.openImagePopupFromDossier(this.selectedDossier);
    }
  }

  closeImagePopup() {
    this.showImagePopup = false;
    this.selectedDossierForImage = null;
    this.selectedFile = null;
    this.imagePreview = null;
  }

  triggerFileInput() {
    this.fileInputRef?.nativeElement?.click();
  }

onFileSelected(event: any) {
  const file = event.target.files[0];
  if (file) {
    if (!file.type.startsWith('image/')) {
      this.notification.error('Please select a valid image.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.notification.error('Image must not exceed 10 MB.');
      return;
    }

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreview = e.target.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);

    console.log('📎 Fichier sélectionné:', file.name, file.type, file.size);
  }
}

/** Images médicales par dossier (les images sont liées au dossier, pas au suivi). */
  dossierImages: { [idDossierMedical: number]: ImageMedicale[] } = {};



  // ========================================
  // UTILITAIRES
  // ========================================

  getFormErrors(): string[] {
    const errors: string[] = [];
    Object.keys(this.dossierForm.controls).forEach(key => {
      const control = this.dossierForm.get(key);
      if (control?.invalid) {
        if (control.errors?.['required']) errors.push(`${key} requis`);
      }
    });
    return errors;
  }

  formatDate(date: string | undefined): string {
    return date ? new Date(date).toLocaleDateString('fr-FR') : '';
  }
  /** Valeur affichable d'un résultat (numérique+unité, texte ou ancienne valeur). */
  formatValeur(r: ResultatLaboratoire): string {
    return formatValeurResultat(r);
  }

  /** Libellé affiché pour un diagnostic (enum value → libelle). */
  getDiagnosticLibelle(diagnostic: string | undefined): string {
    if (!diagnostic) return '—';
    const found = this.diagnostics.find(d => d.value === diagnostic);
    return found ? found.libelle : diagnostic;
  }

  /** Initiales du patient pour l'avatar (ex: "Jean Dupont" → "JD", sinon "P" + id). */
  getPatientInitials(dossier: DossierMedical): string {
    const nom = dossier.patientNom?.trim();
    if (nom) {
      const parts = nom.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      if (parts[0].length >= 1) return parts[0].slice(0, 2).toUpperCase();
    }
    return 'P' + (dossier.idPatient ?? '');
  }

  /** Classe CSS sûre pour le badge diagnostic (évite erreurs si diagnostic null ou caractères spéciaux). */
  getDiagnosticClass(diagnostic: string | undefined): string {
    if (!diagnostic) return 'status-autre';
    const safe = diagnostic.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') || 'autre';
    return 'status-' + safe;
  }

  getStatusClass(resultat: string): string {
    const statusMap: { [key: string]: string } = {
      'GUERISON': 'status-success',
      'REMISSION': 'status-success',
      'AMELIORATION': 'status-success',
      'COMPLIANCE_BONNE': 'status-success',
      'STABLE': 'status-info',
      'EN_COURS': 'status-info',
      'SUIVI_TERMINE': 'status-info',
      'POST_OPERATOIRE': 'status-info',
      'SOUS_SURVEILLANCE': 'status-warning',
      'TRAITEMENT_MODIFIE': 'status-warning',
      'COMPLIANCE_FAIBLE': 'status-warning',
      'ATTENTE_RESULTATS': 'status-warning',
      'CONSULTATION_SPECIALISEE_REQUISE': 'status-warning',
      'GREFFE_EN_ATTENTE': 'status-warning',
      'DETERIORATION': 'status-danger',
      'RECHUTE': 'status-danger',
      'URGENCE': 'status-danger',
      'HOSPITALISATION_REQUISE': 'status-danger',
      'PERDU_DE_VUE': 'status-danger',
      'DECES': 'status-danger'
    };
    return statusMap[resultat] || 'status-default';
  }

  getStatusIcon(resultat: string): string {
    const iconMap: { [key: string]: string } = {
      'GUERISON': '✅', 'REMISSION': '🎉', 'AMELIORATION': '📈',
      'STABLE': '➡️', 'EN_COURS': '⏳', 'SOUS_SURVEILLANCE': '👁️',
      'DETERIORATION': '📉', 'RECHUTE': '🔄', 'URGENCE': '🚨',
      'HOSPITALISATION_REQUISE': '🏥', 'TRAITEMENT_MODIFIE': '💊',
      'COMPLIANCE_BONNE': '👍', 'COMPLIANCE_FAIBLE': '⚠️',
      'ATTENTE_RESULTATS': '⏰', 'CONSULTATION_SPECIALISEE_REQUISE': '👨‍⚕️',
      'GREFFE_EN_ATTENTE': '🫀', 'POST_OPERATOIRE': '🔧',
      'SUIVI_TERMINE': '✔️', 'PERDU_DE_VUE': '❓', 'DECES': '🕊️'
    };
    return iconMap[resultat] || '📝';
  }

  getStatusLabel(resultat: string): string {
    const labelMap: { [key: string]: string } = {
      'EN_COURS': 'En cours', 'STABLE': 'Stable', 'AMELIORATION': 'Amélioration',
      'DETERIORATION': 'Détérioration', 'REMISSION': 'Rémission', 'RECHUTE': 'Rechute',
      'GUERISON': 'Guérison', 'SOUS_SURVEILLANCE': 'Surveillance',
      'HOSPITALISATION_REQUISE': 'Hospitalisation', 'URGENCE': 'Urgence',
      'TRAITEMENT_MODIFIE': 'Traitement modifié', 'COMPLIANCE_FAIBLE': 'Compliance faible',
      'COMPLIANCE_BONNE': 'Bonne compliance', 'ATTENTE_RESULTATS': 'Attente résultats',
      'CONSULTATION_SPECIALISEE_REQUISE': 'Consultation requise',
      'GREFFE_EN_ATTENTE': 'Greffe en attente', 'POST_OPERATOIRE': 'Post-opératoire',
      'SUIVI_TERMINE': 'Terminé', 'PERDU_DE_VUE': 'Perdu de vue', 'DECES': 'Décès'
    };
    return labelMap[resultat] || resultat;
  }

  formatDateFull(date: string): string {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch (e) {
      return date;
    }
  }

  /** URL pour ouvrir la pièce jointe d'un suivi (PDF ou image). */
  getSuiviPieceJointeUrl(cheminPieceJointe: string): string {
    if (!cheminPieceJointe) return '#';
    return cheminPieceJointe.startsWith('/') ? cheminPieceJointe : '/' + cheminPieceJointe;
  }

  formatDateShort(date: string): string {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch (e) {
      return date;
    }
  }
  // ⭐ AJOUTER CES PROPRIÉTÉS DANS LA CLASSE DossiersListComponent ⭐

  // Map pour stocker les images de chaque suivi
  

// ⭐ MODIFIER LA MÉTHODE loadSuivis POUR CHARGER LES IMAGES ⭐

loadSuivis(idDossierMedical: number) {
  console.log('🔄 Chargement des suivis pour le dossier:', idDossierMedical);
  this.loading = true;
  
  this.suiviService.getSuivisByDossier(idDossierMedical).subscribe({
    next: (data) => {
      console.log('✅ Suivis reçus:', data);
      this.suivis = Array.isArray(data) ? data : (data ? [data] : []);
      console.log('📊 Nombre de suivis:', this.suivis.length);
      
      // Charger les images du dossier (liées au dossier, pas au suivi)
      this.loadImagesByDossier(idDossierMedical);
      
      this.loading = false;
      this.cdr.markForCheck();
    },
    error: (err) => {
      console.error('❌ Erreur lors du chargement des suivis:', err);
      
      // Si c'est une erreur 404, initialiser avec un tableau vide
      if (err.message && err.message.includes('404')) {
        console.warn('⚠️ Aucun suivi trouvé ou backend non accessible. Initialisation avec tableau vide.');
        this.suivis = [];
        this.error = ''; // Ne pas afficher d'erreur pour un dossier sans suivis
      } else {
        this.error = err.message || 'Erreur lors du chargement des suivis. Vérifiez que le backend est démarré sur le port 8089.';
      }
      
      this.loading = false;
      this.cdr.markForCheck();
    }
  });
}

/** Data URL pour l’image de repli (évite 404 sur assets/images/placeholder.png). */
  private readonly placeholderImageDataUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgaW5kaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';

  onImageError(event: any) {
    const img = event.target as HTMLImageElement;
    if (img?.src !== this.placeholderImageDataUrl) {
      img.src = this.placeholderImageDataUrl;
    }
  }

submitImage() {
  console.log('📝 Validation du formulaire image...');

  const idDossierMedical = this.selectedDossier?.idDossierMedical ?? this.selectedDossierForImage?.idDossierMedical;

  if (this.imageForm.invalid || !this.selectedFile || !idDossierMedical) {
    this.notification.error('Please fill in all fields and select a record before adding an image.');
    return;
  }

  this.submitting = true;
  const imageData = this.imageForm.value;
  this.imageMedicaleService.uploadFile(this.selectedFile).subscribe({
    next: (uploadRes) => {
      const chemin = uploadRes?.path || '';
      const imageWithPath: ImageMedicale = { ...imageData, idDossierMedical, cheminImage: chemin };
      this.imageMedicaleService.createImageMedicale(idDossierMedical, imageWithPath).subscribe({
        next: () => {
          this.notification.success('Medical image added successfully!');
          this.loadImagesByDossier(idDossierMedical);
          setTimeout(() => {
            this.closeImagePopup();
            this.submitting = false;
            this.cdr.detectChanges();
          }, 0);
        },
        error: (err) => {
          this.notification.error('Error: ' + err.message);
          this.submitting = false;
        }
      });
    },
    error: (err) => {
      this.notification.error('Upload error: ' + err.message);
      this.submitting = false;
    }
  });
}

/** Charge les images médicales du dossier (liées au dossier, pas au suivi). */
loadImagesByDossier(idDossierMedical: number) {
  this.imageMedicaleService.getImagesByDossier(idDossierMedical).subscribe({
    next: (data) => {
      this.dossierImages[idDossierMedical] = data;
      this.cdr.detectChanges();
    },
    error: () => {
      this.dossierImages[idDossierMedical] = [];
    }
  });
}
getImageUrl(cheminImage: string): string {
  console.log('🔗 getImageUrl appelée avec:', cheminImage);
  
  if (!cheminImage) {
    console.warn('⚠️ Chemin vide');
    return this.placeholderImageDataUrl;
  }
  
  // Si déjà une URL HTTP complète
  if (cheminImage.startsWith('http')) {
    console.log('✅ URL déjà complète:', cheminImage);
    return cheminImage;
  }

  // Le backend sert les fichiers uploadés via /uploads/** (WebConfig)
  // cheminImage peut être "uploads/abc123.jpg" ou juste "abc123.jpg"
  let path = cheminImage.startsWith('/') ? cheminImage : '/' + cheminImage;
  if (!path.startsWith('/uploads/')) path = '/uploads/' + cheminImage.replace(/^\//, '');
  // Même origine : proxy Angular → API Gateway (8095), pas d’appel direct au backend
  console.log('🌐 URL image (via gateway):', path);
  return path;
}





// ⭐ NOUVELLES MÉTHODES POUR GÉRER LES IMAGES ⭐

viewImage(image: ImageMedicale) {
  const url = this.getImageUrl(image.cheminImage || '');
  console.log('👁️ Ouverture de:', url);
  window.open(url, '_blank');
}

deleteImage(idImage: number, idDossierMedical: number) {
  this.confirmService.confirm('Are you sure you want to delete this image?', { title: 'Delete image' }).then((ok) => {
    if (!ok) return;
    this.imageMedicaleService.deleteImage(idImage).subscribe({
      next: () => {
        this.notification.success('Image deleted successfully.');
        this.loadImagesByDossier(idDossierMedical);
      },
      error: (err) => {
        this.notification.error('Error during deletion: ' + err.message);
      }
    });
  });
}



getImageTypeLabel(typeImage: string): string {
  const found = this.typesImage.find(t => t.value === typeImage);
  return found ? found.libelle : typeImage;
}

}