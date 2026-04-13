import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { MedicationService, MedicationDTO } from '../services/medication';
import { PrescriptionService, PrescriptionDTO, PrescriptionItemDTO, getPrescriptionPatientId } from '../services/prescription.service';
import { ConsultationService } from '../services/consultation.service';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// ─── Interfaces ────────────────────────────────────────────────────────────────

interface Patient {
  id: number; initials: string; name: string; age: number;
  graft: string; status: string; creatinine: string;
  lastCheck: string; mrn: string; transplantDate: string;
}

interface Medication { id: number; name: string; category: string; targetRange?: string; indication?: string; }

interface PrescribedMedication {
  drugId: number; drugName: string; dose: string;
  frequency: string; route: string; duration: string;
}

interface Prescription {
  id: number; patientId: number; date: string;
  doctorName: string; status: 'active' | 'expired';
  medications: PrescribedMedication[]; notes?: string;
}

interface MedicationAdministration {
  id: number; patientId: number; medicationName: string; dose: string;
  scheduledTime: string; takenTime: string | null;
  taken: boolean; notes?: string;
}

interface ImmunosuppressiveMonitoring {
  id: number; patientId: number; date: string; drugName: string;
  bloodLevel: number; targetRange: string; creatinine: number;
  potassium: number; riskLevel: 'normal' | 'elevated' | 'high';
}

// ✅ MODIFIÉ
interface PrescriptionItem {
  id?: number;
  prescriptionId: number;
  medicationId: number;
  dosageInstructions: string;
  frequency: string;
  administrationRoute: string;
  duration: number;
  startDate: string;
  endDate: string;
  isPriority: boolean;
  scheduledTimes?: string[];  // ✅ NOUVEAU
}

// ─── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-treatment',
  standalone: false,
  templateUrl: './treatment.html',
  styleUrls: ['./treatment.css']
})
export class TreatmentComponent implements OnInit, OnDestroy {

  /** Gateway : `/api/medication-history/**`, `/api/dosage-adjustments/**` → prescription-Service. */
  private apiUrl = '/api';
  private destroy$ = new Subject<void>();

  notifications = 3;
  doctor = { name: 'Dr. Sarah Dupont', role: 'Néphrologue', initials: 'SD' };
  today: string = new Date().toISOString().split('T')[0];

  activeTab: string = 'medications';
  selectedPatient: Patient | null = null;

  patients: Patient[] = [];

  immunosuppressiveDrugs: Medication[] = [
    { id: 1, name: 'Tacrolimus',            category: 'Calcineurin Inhibitor',  targetRange: '5-15 ng/mL' },
    { id: 2, name: 'Mycophenolate Mofetil', category: 'Antiproliferative',      targetRange: '1-3.5 mg/L' },
    { id: 3, name: 'Prednisone',            category: 'Corticosteroid',         targetRange: 'N/A' },
    { id: 4, name: 'Cyclosporine',          category: 'Calcineurin Inhibitor',  targetRange: '100-200 ng/mL' },
    { id: 5, name: 'Azathioprine',          category: 'Antiproliferative',      targetRange: 'N/A' }
  ];

  otherMedications: Medication[] = [
    { id: 6,  name: 'Omeprazole',                    category: 'PPI',              indication: 'Protection gastrique' },
    { id: 7,  name: 'Trimethoprim-Sulfamethoxazole', category: 'Antibiotique',     indication: 'Prophylaxie PCP' },
    { id: 8,  name: 'Valganciclovir',                category: 'Antiviral',        indication: 'Prophylaxie CMV' },
    { id: 9,  name: 'Nifedipine',                    category: 'Antihypertenseur', indication: 'Contrôle tension' },
    { id: 10, name: 'Calcium Carbonate',             category: 'Supplément',       indication: 'Santé osseuse' }
  ];

  medications: MedicationDTO[] = [];
  prescriptions: any[] = [];
  prescriptionItems: PrescriptionItem[] = [];
  medicationHistory: any[] = [];

  filteredMeds: MedicationDTO[]     = [];
  filteredPrescriptions: any[]      = [];
  filteredItems: PrescriptionItem[] = [];
  filteredHistory: any[]            = [];

  medSearch = ''; medCatFilter = ''; medFormFilter = ''; medMonitorFilter = '';
  prescSearch = ''; prescSort = 'recent';
  itemSearch = '';
  histSearch = ''; histStatusFilter = '';

  sortField = ''; sortDir: 'asc' | 'desc' = 'asc';

  administrations: MedicationAdministration[] = [];
  monitoring: ImmunosuppressiveMonitoring[]   = [];

  showMedicationModal   = false;
  showPrescriptionModal = false;
  showItemModal         = false;
  showHistoryModal      = false;
  showAdminModal        = false;
  showMonitoringModal   = false;

  newMedication: MedicationDTO  = this.getEmptyMedication();
  newPrescription: any          = this.getEmptyPrescription();
  newHistory: any               = this.getEmptyHistory();
  newItem: PrescriptionItem     = this.getEmptyItem();

  selectedMedInfo: MedicationDTO | null = null;
  currentPrescriptionId = 0;
  private itemIdCounter = 1;
  selectedDrugId: number | null = null;

  // ✅ NOUVEAU
  scheduledTimes: string[] = [];

  // ✅ POIDS / DOSE (dosage selon le poids)
  patientWeightKg = 0;
  calculatedDose = 0;
  weightSaved = false;

  newAdministration = { medicationName: '', dose: '', scheduledTime: '', taken: false, takenTime: '', notes: '' };
  newMonitoring = { drugName: '', bloodLevel: null as number | null, creatinine: null as number | null, potassium: null as number | null, date: '' };

  isEditMode  = false;
  editingId: number | null = null;

  toastSuccess = false;
  toastError   = false;
  toastMsg     = '';

  medicationNameError: string = '';

  constructor(
    private http: HttpClient,
    private medicationService: MedicationService,
    private prescriptionService: PrescriptionService,
    private consultationService: ConsultationService,
    private cdr: ChangeDetectorRef,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadPatients();
    this.loadSampleData();
    this.loadAllData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ════════════════════ CHARGEMENT API ════════════════════
loadPatients(): void {
  this.consultationService.getPatients()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        const raw = Array.isArray(data) ? data : [];
        if (raw.length === 0) {
          this.loadPatientsFromGatewayApi();
          return;
        }
        this.applyPatientsFromRaw(raw);
      },
      error: (err) => {
        console.error('❌ Erreur chargement patients (consultation):', err);
        this.loadPatientsFromGatewayApi();
      }
    });
}

  /** Fallback : `/api/patients` (gateway / Symfony) si projetconsultation ne renvoie rien. */
  private loadPatientsFromGatewayApi(): void {
    this.http.get<any[]>('/api/patients')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.applyPatientsFromRaw(Array.isArray(data) ? data : []),
        error: (e) => {
          console.error('❌ Erreur chargement patients (/api/patients):', e);
          this.patients = [];
          this.cdr.detectChanges();
        }
      });
  }

  private applyPatientsFromRaw(raw: any[]): void {
    this.patients = raw
      .map((p: any) => {
        const pid = Number(p.idPatient ?? p.id ?? p.patientId);
        if (!pid || Number.isNaN(pid)) return null;

        const firstName = p.firstName ?? p.prenom ?? '';
        const lastName  = p.lastName ?? p.nom ?? '';
        const name = [firstName, lastName].filter(Boolean).join(' ').trim()
                  || p.username || p.email || p.login || `Patient #${pid}`;

        const initials = name
          .split(/\s+/)
          .map((s: string) => s[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || '??';

        let age = 0;
        const dob = p.dateNaissance ?? p.date_naissance;
        if (dob) {
          const birth = new Date(dob);
          const today = new Date();
          age = today.getFullYear() - birth.getFullYear();
          const m = today.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        }

        return {
          id:             pid,
          initials,
          name,
          age,
          graft:          '—',
          status:         '—',
          creatinine:     '—',
          lastCheck:      '—',
          mrn:            p.username || p.login || '—',
          transplantDate: '—'
        } as Patient;
      })
      .filter((x): x is Patient => x != null);

    if (this.patients.length && !this.selectedPatient) {
      this.selectedPatient = this.patients[0];
    }
    this.cdr.detectChanges();
  }

  loadAllData(): void {
    this.loadMedications();
    this.loadPrescriptions();
    this.loadPrescriptionItems();
    this.loadMedicationHistory();
  }

  loadMedications(): void {
    this.medicationService.getAllMedications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.medications = data;
          this.filterMeds();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('❌ Erreur Médicaments:', err);
          this.showError('Erreur chargement médicaments');
        }
      });
  }

  loadPrescriptions(): void {
    this.prescriptionService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.prescriptions = data ?? [];
          this.filterPrescriptions();
          this.cdr.detectChanges();
        },
        error: (err) => console.error('❌ Erreur Prescriptions:', err)
      });
  }

  loadPrescriptionItems(): void {
    this.prescriptionService.getAllItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.prescriptionItems = (data ?? []) as PrescriptionItem[];
          this.filterItems();
          this.cdr.detectChanges();
        },
        error: (err) => console.error('❌ Erreur Items:', err)
      });
  }

  loadMedicationHistory(): void {
    this.http.get<any[]>(`${this.apiUrl}/medication-history`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.medicationHistory = data;
          this.filterHistory();
          this.cdr.detectChanges();
        },
        error: (err) => console.error('❌ Erreur Historique:', err)
      });
  }

  loadSampleData(): void {
    this.administrations = [
      { id: 1, patientId: 1, medicationName: 'Tacrolimus',            dose: '2 mg',   scheduledTime: '2025-02-14T08:00', takenTime: '2025-02-14T08:15', taken: true,  notes: '' },
      { id: 2, patientId: 1, medicationName: 'Tacrolimus',            dose: '2 mg',   scheduledTime: '2025-02-14T20:00', takenTime: null,               taken: false, notes: '' },
      { id: 3, patientId: 1, medicationName: 'Mycophenolate Mofetil', dose: '500 mg', scheduledTime: '2025-02-14T08:00', takenTime: '2025-02-14T08:15', taken: true,  notes: '' }
    ];
    this.monitoring = [
      { id: 1, patientId: 1, date: '2025-02-10', drugName: 'Tacrolimus', bloodLevel: 8.5,  targetRange: '5-15', creatinine: 0.9, potassium: 4.2, riskLevel: 'normal' },
      { id: 2, patientId: 1, date: '2025-02-05', drugName: 'Tacrolimus', bloodLevel: 12.3, targetRange: '5-15', creatinine: 0.8, potassium: 4.5, riskLevel: 'normal' },
      { id: 3, patientId: 1, date: '2025-01-28', drugName: 'Tacrolimus', bloodLevel: 16.8, targetRange: '5-15', creatinine: 1.1, potassium: 4.8, riskLevel: 'elevated' }
    ];
  }

  // ════════════════════ ONGLETS ════════════════════

  setActiveTab(tab: string): void { this.activeTab = tab; }
  selectPatient(p: Patient): void  { this.selectedPatient = p; }

  // ════════════════════ RECHERCHE / FILTRES ════════════════════

  filterMeds(): void {
    let list = [...this.medications];
    if (this.medSearch) {
      const t = this.medSearch.toLowerCase();
      list = list.filter(m =>
        m.name.toLowerCase().includes(t) ||
        (m.activeIngredient && m.activeIngredient.toLowerCase().includes(t)) ||
        (m.category && m.category.toLowerCase().includes(t))
      );
    }
    if (this.medCatFilter)   list = list.filter(m => m.category === this.medCatFilter);
    if (this.medFormFilter)  list = list.filter(m => m.form     === this.medFormFilter);
    if (this.medMonitorFilter === 'yes') list = list.filter(m =>  m.requiresMonitoring);
    if (this.medMonitorFilter === 'no')  list = list.filter(m => !m.requiresMonitoring);
    if (this.sortField) {
      list.sort((a: any, b: any) => {
        let av = a[this.sortField]; let bv = b[this.sortField];
        if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
        if (av < bv) return this.sortDir === 'asc' ? -1 : 1;
        if (av > bv) return this.sortDir === 'asc' ?  1 : -1;
        return 0;
      });
    }
    this.filteredMeds = list;
  }

  sortBy(field: string): void {
    if (this.sortField === field) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
    else { this.sortField = field; this.sortDir = 'asc'; }
    this.filterMeds();
  }

  sortIcon(field: string): string {
    if (this.sortField !== field) return '⇅';
    return this.sortDir === 'asc' ? '↑' : '↓';
  }

  resetMedFilters(): void {
    this.medSearch = ''; this.medCatFilter = ''; this.medFormFilter = ''; this.medMonitorFilter = '';
    this.filterMeds();
  }

  filterPrescriptions(): void {
    let list = [...this.prescriptions];
    if (this.prescSearch) {
      const t = this.prescSearch.toLowerCase();
      list = list.filter(p => p.patientId?.toString().includes(t) || p.notes?.toLowerCase().includes(t));
    }
    list.sort((a, b) => {
      const da = new Date(a.prescriptionDate).getTime();
      const db = new Date(b.prescriptionDate).getTime();
      return this.prescSort === 'recent' ? db - da : da - db;
    });
    this.filteredPrescriptions = list;
  }

  filterItems(): void {
    let list = [...this.prescriptionItems];
    if (this.itemSearch) {
      const t = this.itemSearch.toLowerCase();
      list = list.filter(i =>
        this.getMedName(i.medicationId).toLowerCase().includes(t) ||
        i.frequency.toLowerCase().includes(t) ||
        i.dosageInstructions.toLowerCase().includes(t)
      );
    }
    this.filteredItems = list;
  }

  filterHistory(): void {
    let list = [...this.medicationHistory];
    if (this.histSearch) {
      const t = this.histSearch.toLowerCase();
      list = list.filter(h =>
        h.patientId?.toString().includes(t) ||
        (h.medicationName && h.medicationName.toLowerCase().includes(t)) ||
        (h.administeredBy && h.administeredBy.toLowerCase().includes(t))
      );
    }
    if (this.histStatusFilter) list = list.filter(h => h.status === this.histStatusFilter);
    this.filteredHistory = list;
  }

  // ════════════════════ MEDICATION CRUD ════════════════════

  openMedicationModal(medication?: MedicationDTO): void {
    this.isEditMode    = !!medication;
    this.editingId     = medication?.id ?? null;
    this.newMedication = medication ? { ...medication } : this.getEmptyMedication();
    this.medicationNameError = '';
    this.showMedicationModal = true;
  }

  closeMedicationModal(): void {
    this.showMedicationModal = false;
    this.newMedication = this.getEmptyMedication();
    this.isEditMode = false;
    this.editingId = null;
    this.medicationNameError = '';
  }

  submitMedication(form: any): void {
    if (form.invalid) {
      Object.values(form.controls).forEach((ctrl: any) => ctrl.markAsTouched());
      this.showError('Veuillez corriger les erreurs dans le formulaire');
      return;
    }
    this.saveMedication();
  }

  saveMedication(): void {
    this.medicationNameError = '';
    if (this.isEditMode && this.editingId) {
      this.medicationService.updateMedication(this.editingId, this.newMedication).subscribe({
        next: () => {
          this.closeMedicationModal();
          this.showSuccess('Médicament mis à jour !');
          this.loadMedications();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur backend:', err);
          if (err.status === 409) {
            this.medicationNameError = 'Un médicament avec ce nom existe déjà';
          } else if (err.error && typeof err.error === 'object') {
            let errorMsg = 'Erreurs:\n';
            Object.keys(err.error).forEach(key => { errorMsg += `- ${err.error[key]}\n`; });
            this.showError(errorMsg);
          } else {
            this.showError(err.message || 'Erreur lors de la mise à jour');
          }
        }
      });
    } else {
      this.medicationService.createMedication(this.newMedication).subscribe({
        next: () => {
          this.closeMedicationModal();
          this.showSuccess('Médicament créé !');
          this.loadMedications();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur backend:', err);
          if (err.status === 409) {
            this.medicationNameError = 'Un médicament avec ce nom existe déjà';
          } else if (err.error && typeof err.error === 'object') {
            let errorMsg = 'Erreurs:\n';
            Object.keys(err.error).forEach(key => { errorMsg += `- ${err.error[key]}\n`; });
            this.showError(errorMsg);
          } else {
            this.showError(err.message || 'Erreur lors de la création');
          }
        }
      });
    }
  }

  deleteMedication(id: number | undefined): void {
    if (!id) { this.showError('ID invalide'); return; }
    if (!confirm('Supprimer ce médicament ?')) return;
    this.medicationService.deleteMedication(id).subscribe({
      next: () => {
        this.showSuccess('Médicament supprimé !');
        this.loadMedications();
        this.cdr.detectChanges();
      },
      error: (err) => { console.error(err); this.showError(err.message); }
    });
  }

  // ════════════════════ PRESCRIPTION CRUD ════════════════════

  openPrescriptionModal(p?: any): void {
    this.isEditMode      = !!p;
    this.editingId       = p?.id ?? null;
    this.newPrescription = p ? { ...p } : this.getEmptyPrescription();
    if (!p && this.selectedPatient) this.newPrescription.patientId = this.selectedPatient.id;
    if (this.patients.length === 0) this.loadPatients();
    this.showPrescriptionModal = true;
  }

  closePrescriptionModal(): void {
    this.showPrescriptionModal = false;
    this.newPrescription = this.getEmptyPrescription();
    this.isEditMode = false;
    this.editingId = null;
  }

  submitPrescription(form: any): void {
    if (form.invalid) {
      Object.values(form.controls).forEach((ctrl: any) => ctrl.markAsTouched());
      this.showError('Veuillez corriger les erreurs dans le formulaire');
      return;
    }
    this.savePrescription();
  }

  savePrescription(): void {
    const payload: PrescriptionDTO = {
      patientId: this.newPrescription.patientId!,
      prescriptionDate: this.newPrescription.prescriptionDate,
      notes: this.newPrescription.notes
    };
    const obs = this.isEditMode && this.editingId
      ? this.prescriptionService.update(this.editingId, { ...payload, id: this.editingId })
      : this.prescriptionService.create(payload);
    obs.subscribe({
      next: () => {
        this.closePrescriptionModal();
        this.showSuccess('Prescription enregistrée !');
        this.loadPrescriptions();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur backend:', err);
        this.showError(err.message || 'Erreur lors de l\'enregistrement');
      }
    });
  }

  deletePrescription(id: number): void {
    if (!confirm('Supprimer cette prescription ?')) return;
    this.prescriptionService.delete(id).subscribe({
      next: () => {
        this.showSuccess('Prescription supprimée !');
        this.prescriptionItems = this.prescriptionItems.filter(i => i.prescriptionId !== id);
        this.filterItems();
        this.loadPrescriptions();
        this.cdr.detectChanges();
      },
      error: (err) => { console.error(err); this.showError('Erreur lors de la suppression'); }
    });
  }

  getPrescriptionItems(prescriptionId: number): PrescriptionItem[] {
    return this.prescriptionItems.filter(i => i.prescriptionId === prescriptionId);
  }

  getPatientPrescriptions(): any[] {
    if (!this.selectedPatient) return [];
    return this.prescriptions.filter(p => p.patientId === this.selectedPatient!.id);
  }

  /** Retourne le nom du patient pour un patientId, ou "Patient #X" si non trouvé */
  getPatientName(patientId: number | undefined): string {
    if (patientId == null) return '—';
    const pat = this.patients.find(p => p.id === patientId);
    return pat?.name || `Patient #${patientId}`;
  }

  /** Extrait patientId d'une prescription (patientId ou patient_id) */
  getPrescriptionPatientId(p: any): number {
    return getPrescriptionPatientId(p);
  }

  // ════════════════════ PRESCRIPTION ITEM ════════════════════

  openItemModal(prescriptionId: number): void {
    this.currentPrescriptionId = prescriptionId;
    this.newItem = this.getEmptyItem();
    this.newItem.prescriptionId = prescriptionId;
    this.selectedMedInfo = null;
    this.scheduledTimes = [];
    this.patientWeightKg = 0;
    this.calculatedDose = 0;
    this.weightSaved = false;
    this.showItemModal = true;
  }

  closeItemModal(): void {
    this.showItemModal = false;
    this.newItem = this.getEmptyItem();
    this.selectedMedInfo = null;
    this.scheduledTimes = [];
    this.patientWeightKg = 0;
    this.calculatedDose = 0;
    this.weightSaved = false;
  }

  submitItem(form: any): void {
    if (form.invalid) {
      Object.values(form.controls).forEach((ctrl: any) => ctrl.markAsTouched());
      this.showError('Veuillez corriger les erreurs dans le formulaire');
      return;
    }
    this.saveItem();
  }

  onMedSelected(medId: number): void {
    this.selectedMedInfo = this.medications.find(m => m.id === medId) ?? null;
    this.patientWeightKg = 0;
    this.calculatedDose = 0;
    this.weightSaved = false;
  }

  onWeightChange(): void {
    if (this.patientWeightKg > 0) {
      this.calculatedDose = Math.round(this.patientWeightKg * 0.1 * 10) / 10;
      this.newItem.dosageInstructions = `${this.calculatedDose} mg 2x/jour`;
      this.weightSaved = false;
    } else {
      this.calculatedDose = 0;
    }
  }

  recordWeight(): void {
    if (!this.patientWeightKg || this.patientWeightKg <= 0) return;
    const presc = this.prescriptions.find(p => p.id === this.newItem.prescriptionId);
    if (!presc) { this.showError('Prescription introuvable'); return; }
    const patientId = presc.patientId ?? presc.patient_id;
    if (!patientId) { this.showError('Patient introuvable'); return; }

    this.http.post(`${this.apiUrl}/dosage-adjustments/weight`, {
      patientId,
      weightKg: this.patientWeightKg
    }).subscribe({
      next: () => {
        this.weightSaved = true;
        this.showSuccess('✅ Poids enregistré — ajustement créé pour validation');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur enregistrement poids:', err);
        this.showError('Erreur lors de l\'enregistrement du poids');
      }
    });
  }

  // ✅ NOUVEAU — accept string (ngModelChange) or Event for strict template typing
  onFrequencyChange(value: string | unknown): void {
    const frequency = typeof value === 'string' ? value : '';
    switch (frequency) {
      case '1x/jour':
      case '1x/semaine':
        this.scheduledTimes = ['08:00'];
        break;
      case '2x/jour':
      case 'Toutes les 12h':
        this.scheduledTimes = ['08:00', '20:00'];
        break;
      case '3x/jour':
      case 'Toutes les 8h':
        this.scheduledTimes = ['08:00', '14:00', '20:00'];
        break;
      default:
        this.scheduledTimes = [];
    }
    this.newItem.scheduledTimes = this.scheduledTimes;
  }

  // ✅ MODIFIÉ
  saveItem(): void {
    if (!this.newItem.medicationId || !this.newItem.dosageInstructions || !this.newItem.frequency) {
      this.showError('Veuillez remplir les champs obligatoires');
      return;
    }

    // ✅ Inclure les horaires
    this.newItem.scheduledTimes = this.scheduledTimes;
    const payload: PrescriptionItemDTO = {
      prescriptionId: this.newItem.prescriptionId,
      medicationId: this.newItem.medicationId,
      dosageInstructions: this.newItem.dosageInstructions,
      frequency: this.newItem.frequency,
      duration: this.newItem.duration,
      administrationRoute: this.newItem.administrationRoute,
      startDate: this.newItem.startDate,
      endDate: this.newItem.endDate,
      isPriority: this.newItem.isPriority,
      scheduledTimes: this.newItem.scheduledTimes
    };

    this.prescriptionService.createItem(payload).subscribe({
      next: () => {
        this.closeItemModal();
        this.showSuccess('Médicament ajouté à la prescription !');
        this.loadPrescriptionItems();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur backend:', err);
        const localItem: PrescriptionItem = { ...this.newItem, id: this.itemIdCounter++ };
        this.prescriptionItems.push(localItem);
        this.filterItems();
        this.closeItemModal();
        this.showSuccess('Médicament ajouté à la prescription !');
        this.cdr.detectChanges();
      }
    });
  }

  deleteItem(id: number | undefined): void {
    if (!id) return;
    if (!confirm('Retirer ce médicament de la prescription ?')) return;
    this.prescriptionService.deleteItem(id).subscribe({
      next: () => {
        this.showSuccess('Médicament retiré !');
        this.loadPrescriptionItems();
        this.cdr.detectChanges();
      },
      error: () => {
        this.prescriptionItems = this.prescriptionItems.filter(i => i.id !== id);
        this.filterItems();
        this.showSuccess('Médicament retiré !');
        this.cdr.detectChanges();
      }
    });
  }

  // ════════════════════ HISTORY CRUD ════════════════════

  openHistoryModal(h?: any): void {
    this.isEditMode = !!h;
    this.editingId  = h?.id ?? null;
    this.newHistory = h ? { ...h } : this.getEmptyHistory();
    if (!h && this.selectedPatient) {
      this.newHistory.patientId = this.selectedPatient.id;
    }
    this.showHistoryModal = true;
  }

  closeHistoryModal(): void {
    this.showHistoryModal = false;
    this.newHistory = this.getEmptyHistory();
    this.isEditMode = false;
    this.editingId = null;
  }

  submitHistory(form: any): void {
    if (form.invalid) {
      Object.values(form.controls).forEach((ctrl: any) => ctrl.markAsTouched());
      this.showError('Veuillez corriger les erreurs dans le formulaire');
      return;
    }
    this.saveHistory();
  }

  saveHistory(): void {
    const obs = this.isEditMode && this.editingId
      ? this.http.put(`${this.apiUrl}/medication-history/${this.editingId}`, this.newHistory)
      : this.http.post(`${this.apiUrl}/medication-history`, this.newHistory);
    obs.subscribe({
      next: () => {
        this.closeHistoryModal();
        this.showSuccess('Prise enregistrée !');
        this.loadMedicationHistory();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur backend:', err);
        this.showError(err.message || 'Erreur lors de l\'enregistrement');
      }
    });
  }

  deleteHistory(id: number): void {
    if (!confirm('Supprimer cet enregistrement ?')) return;
    this.http.delete(`${this.apiUrl}/medication-history/${id}`).subscribe({
      next: () => {
        this.showSuccess('Enregistrement supprimé !');
        this.loadMedicationHistory();
        this.cdr.detectChanges();
      },
      error: (err) => { console.error(err); this.showError('Erreur lors de la suppression'); }
    });
  }

  // ════════════════════ ADMINISTRATIONS ════════════════════

  getPatientAdministrations(): MedicationAdministration[] {
    if (!this.selectedPatient) return [];
    return this.administrations.filter(a => a.patientId === this.selectedPatient!.id);
  }
  getTodayAdministrations(): MedicationAdministration[] {
    const today = new Date().toISOString().split('T')[0];
    return this.getPatientAdministrations().filter(a => a.scheduledTime.startsWith(today));
  }
  getTakenAdministrations(): MedicationAdministration[] {
    return this.getPatientAdministrations().filter(a => a.taken).slice(0, 5);
  }
  markAsTaken(admin: MedicationAdministration): void {
    admin.taken = true; admin.takenTime = new Date().toISOString();
  }
  openAdminModal(): void {
    this.showAdminModal = true;
    this.newAdministration = {
      medicationName: '', dose: '',
      scheduledTime: new Date().toISOString().slice(0, 16),
      taken: false, takenTime: '', notes: ''
    };
  }
  closeAdminModal(): void { this.showAdminModal = false; }
  saveAdministration(): void {
    if (!this.selectedPatient || !this.newAdministration.medicationName) return;
    this.administrations.push({
      id: this.administrations.length + 1,
      patientId: this.selectedPatient.id,
      medicationName: this.newAdministration.medicationName,
      dose: this.newAdministration.dose,
      scheduledTime: this.newAdministration.scheduledTime,
      takenTime: this.newAdministration.taken ? (this.newAdministration.takenTime || new Date().toISOString()) : null,
      taken: this.newAdministration.taken,
      notes: this.newAdministration.notes
    });
    this.closeAdminModal();
  }

  // ════════════════════ MONITORING ════════════════════

  getPatientMonitoring(): ImmunosuppressiveMonitoring[] {
    if (!this.selectedPatient) return [];
    return this.monitoring
      .filter(m => m.patientId === this.selectedPatient!.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  getLatestMonitoring(): ImmunosuppressiveMonitoring | null {
    const r = this.getPatientMonitoring(); return r.length > 0 ? r[0] : null;
  }
  openMonitoringModal(): void {
    this.showMonitoringModal = true;
    this.newMonitoring = { drugName: 'Tacrolimus', bloodLevel: null, creatinine: null, potassium: null, date: new Date().toISOString().split('T')[0] };
  }
  closeMonitoringModal(): void { this.showMonitoringModal = false; }
  saveMonitoring(): void {
    if (!this.selectedPatient || !this.newMonitoring.bloodLevel) return;
    this.monitoring.push({
      id: this.monitoring.length + 1,
      patientId: this.selectedPatient.id,
      date: this.newMonitoring.date,
      drugName: this.newMonitoring.drugName,
      bloodLevel: this.newMonitoring.bloodLevel,
      targetRange: this.getTargetRange(this.newMonitoring.drugName),
      creatinine: this.newMonitoring.creatinine || 0,
      potassium: this.newMonitoring.potassium || 0,
      riskLevel: this.calculateRiskLevel(this.newMonitoring.bloodLevel, this.newMonitoring.drugName)
    });
    this.closeMonitoringModal();
  }
  calculateRiskLevel(level: number, drugName: string): 'normal' | 'elevated' | 'high' {
    if (drugName === 'Tacrolimus') {
      if (level >= 5  && level <= 15) return 'normal';
      if (level > 15  && level <= 20) return 'elevated';
      return 'high';
    }
    return 'normal';
  }
  getTargetRange(drugName: string): string {
    return this.immunosuppressiveDrugs.find(d => d.name === drugName)?.targetRange || 'N/A';
  }
  isInRange(level: number, drugName: string): boolean {
    return drugName === 'Tacrolimus' ? (level >= 5 && level <= 15) : true;
  }
  calculateAdherence(): number {
    const admins = this.getPatientAdministrations();
    if (!admins.length) return 0;
    return Math.round((admins.filter(a => a.taken).length / admins.length) * 100);
  }

  // ════════════════════ HELPERS ════════════════════

  getMedName(medicationId: number): string {
    const m = this.medications.find(x => x.id === medicationId);
    if (m) return m.name;
    const loc = [...this.immunosuppressiveDrugs, ...this.otherMedications].find(x => x.id === medicationId);
    return loc ? loc.name : `Médicament #${medicationId}`;
  }
  getMedDosage(medicationId: number): string {
    const m = this.medications.find(x => x.id === medicationId);
    return m ? `${m.dosage} ${m.unit}` : '';
  }
  getMedCategory(medicationId: number): string {
    const m = this.medications.find(x => x.id === medicationId);
    return m ? m.category : '';
  }
  getAllMedications(): Medication[] {
    return [...this.immunosuppressiveDrugs, ...this.otherMedications];
  }
  addMedicationToPrescription(): void { if (this.selectedDrugId) this.selectedDrugId = null; }
  removeMedicationFromPrescription(_index: number): void {}

  getEmptyMedication(): MedicationDTO {
    return { name: '', dosage: '', unit: 'mg', form: 'comprimé', activeIngredient: '', category: 'antipyrétique', requiresMonitoring: false, contraindications: '' };
  }
  getEmptyPrescription(): any {
    return { patientId: null, prescriptionDate: new Date().toISOString().split('T')[0], notes: '' };
  }
  getEmptyHistory(): any {
    return { prescriptionItemId: null, patientId: null, takenAt: new Date().toISOString().slice(0, 16), status: 'TAKEN', actualDosage: '', notes: '', administeredBy: '', sideEffects: '', temperature: null, vitalSigns: '' };
  }
  getEmptyItem(): PrescriptionItem {
    const today = new Date().toISOString().split('T')[0];
    const end = new Date(); end.setDate(end.getDate() + 30);
    return { prescriptionId: 0, medicationId: 0, dosageInstructions: '', frequency: '', administrationRoute: 'orale', duration: 30, startDate: today, endDate: end.toISOString().split('T')[0], isPriority: false, scheduledTimes: [] };
  }

  formatDate(date: string): string { return date ? new Date(date).toLocaleDateString('fr-FR') : ''; }
  formatTime(d: string): string { return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
  formatDateTime(d: string): string { return d ? new Date(d).toLocaleString('fr-FR') : ''; }

  getStatusClass(status: string): string {
    const map: Record<string, string> = { TAKEN: 'stable', taken: 'stable', MISSED: 'danger', missed: 'danger', DELAYED: 'warning', delayed: 'warning', REFUSED: 'danger', refused: 'danger', 'CKD Stage 2': 'warning', stable: 'stable' };
    return map[status] ?? '';
  }
  getStatusLabel(status: string): string {
    const map: Record<string, string> = { TAKEN: 'Pris', MISSED: 'Manqué', DELAYED: 'Retardé', REFUSED: 'Refusé' };
    return map[status] ?? status;
  }
  getRiskClass(risk: string): string {
    const map: Record<string, string> = { normal: 'stable', elevated: 'warning', high: 'danger' };
    return map[risk] ?? 'stable';
  }

  showSuccess(msg: string): void {
    this.toastMsg = msg; this.toastSuccess = true; this.toastError = false;
    setTimeout(() => this.toastSuccess = false, 3000);
  }
  showError(msg: string): void {
    this.toastMsg = msg; this.toastError = true; this.toastSuccess = false;
    setTimeout(() => this.toastError = false, 3500);
  }

  logout(): void { this.auth.logout(); }
  // ── Ajustement de dose ──
showDosageModal = false;
dosageLoading = false;
pendingAdjustments: any[] = [];
currentDosagePatientId: number | null = null;

openDosageModal(item: PrescriptionItem): void {
  // Récupère le patientId depuis la prescription
  const prescription = this.prescriptions.find(p => p.id === item.prescriptionId);
  if (!prescription) return;
  
  this.currentDosagePatientId = prescription.patientId;
  this.showDosageModal = true;
  this.loadPendingAdjustments();
}

closeDosageModal(): void {
  this.showDosageModal = false;
  this.pendingAdjustments = [];
  this.currentDosagePatientId = null;
}

loadPendingAdjustments(): void {
  this.dosageLoading = true;
  this.http.get<any[]>(`${this.apiUrl}/dosage-adjustments/pending`)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        // Filtre par patientId si disponible
        this.pendingAdjustments = this.currentDosagePatientId
          ? data.filter(a => a.patientId === this.currentDosagePatientId)
          : data;
        this.dosageLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.dosageLoading = false;
        this.showError('Erreur chargement ajustements');
      }
    });
}

approveDosage(adjustmentId: number): void {
  this.http.put(`${this.apiUrl}/dosage-adjustments/${adjustmentId}/approve`,
    { doctorName: this.doctor.name })
    .subscribe({
      next: () => {
        this.showSuccess('✅ Ajustement approuvé par ' + this.doctor.name);
        this.loadPendingAdjustments();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.showError('Erreur lors de l\'approbation');
      }
    });
}

rejectDosage(adjustmentId: number): void {
  if (!confirm('Rejeter cet ajustement de dose ?')) return;
  this.http.put(`${this.apiUrl}/dosage-adjustments/${adjustmentId}/reject`, {})
    .subscribe({
      next: () => {
        this.showSuccess('Ajustement rejeté');
        this.loadPendingAdjustments();
        this.cdr.detectChanges();
      },
      error: () => this.showError('Erreur lors du rejet')
    });
}

isImmunosuppressor(medicationId: number): boolean {
  const med = this.medications.find(m => m.id === medicationId);
  const cat = (med?.category || '').toLowerCase();
  return cat.includes('immunosuppresseur') || cat.includes('immunosuppressant') ||
    cat.includes('calcineurin') || cat.includes('antiproliferative') || cat.includes('corticosteroid');
}
}