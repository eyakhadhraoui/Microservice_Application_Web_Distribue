import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicationScannerService, ScanResult, CompareResult, PrescriptionItem } from '../services/medication-scanner.service';
import { MedicationService } from '../services/medication';

@Component({
  selector:    'app-medication-scanner',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './medication-scanner.html',
  styleUrls:   ['./medication-scanner.css']
})
export class MedicationScannerComponent implements OnInit {

  /** Liste des médicaments prescrits pour la comparaison (chargée via MedicationService ou mock). */
  @Input() prescriptionItems: PrescriptionItem[] = [];

  isScanning    = false;
  isDragging    = false;
  previewUrl:   string | null = null;
  scanResult:   ScanResult    | null = null;
  compareResult: CompareResult | null = null;
  errorMsg:     string | null = null;
  loadingPrescriptions = false;

  constructor(
    private scanner: MedicationScannerService,
    private medicationService: MedicationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPrescriptionItems();
  }

  /** Charge les médicaments prescrits (API ou mock) pour alimenter la comparaison OCR. */
  private loadPrescriptionItems(): void {
    if (this.prescriptionItems.length > 0) return; // déjà fournis par le parent
    this.loadingPrescriptions = true;
    this.cdr.detectChanges();

    this.medicationService.getAllMedications().subscribe({
      next: (meds) => {
        this.prescriptionItems = (meds || []).map(m => ({
          medicationName: m.name,
          drugName: m.name,
          name: m.name,
          dosage: m.dosage,
          dose: m.dosage,
        }));
        this.loadingPrescriptions = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.prescriptionItems = this.getMockPrescriptionItems();
        this.loadingPrescriptions = false;
        this.cdr.detectChanges();
      },
    });
  }

  private getMockPrescriptionItems(): PrescriptionItem[] {
    return [
      { medicationName: 'Tacrolimus', drugName: 'Tacrolimus', dosage: '2 mg', dose: '2 mg', frequency: 'Twice daily' },
      { medicationName: 'Mycophenolate Mofetil', drugName: 'Mycophenolate Mofetil', dosage: '500 mg', dose: '500 mg', frequency: 'Twice daily' },
      { medicationName: 'Prednisone', drugName: 'Prednisone', dosage: '5 mg', dose: '5 mg', frequency: 'Once daily' },
      { medicationName: 'Lisinopril', drugName: 'Lisinopril', dosage: '10 mg', dose: '10 mg', frequency: 'Once daily' },
      { medicationName: 'Vitamin D', drugName: 'Vitamin D', dosage: '1000 UI', dose: '1000 UI', frequency: 'Once daily' },
    ];
  }

  // ── Drag & Drop ────────────────────────────────
  onDragOver(e: DragEvent)  { e.preventDefault(); this.isDragging = true;  }
  onDragLeave(e: DragEvent) { e.preventDefault(); this.isDragging = false; }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging = false;
    const file = e.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  // ── Sélection fichier ──────────────────────────
  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (file) this.processFile(file);
    // ✅ Reset l'input pour permettre de re-sélectionner le même fichier
    input.value = '';
  }

  private processFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.errorMsg = 'Veuillez sélectionner une image (JPG, PNG, etc.)';
      this.cdr.detectChanges();
      return;
    }

    // Prévisualisation immédiate
    const reader = new FileReader();
    reader.onload = (ev) => {
      this.previewUrl = ev.target?.result as string;
      this.cdr.detectChanges(); // ✅ force l'affichage de la preview
    };
    reader.readAsDataURL(file);

    // Lance le scan OCR
    this.scan(file);
  }

  async scan(file: File): Promise<void> {
    this.isScanning    = true;
    this.scanResult    = null;
    this.compareResult = null;
    this.errorMsg      = null;
    this.cdr.detectChanges(); // ✅ affiche le spinner immédiatement

    try {
      this.scanResult = await this.scanner.scanImage(file);
      this.compareResult = this.scanner.compareToPrescription(
        this.scanResult,
        this.prescriptionItems
      );
    } catch (err: any) {
      this.errorMsg = err?.message ?? 'Erreur lors de la lecture de l\'image.';
      console.error('Scanner error:', err);
    } finally {
      this.isScanning = false;
      this.cdr.detectChanges(); // ✅ affiche le résultat
    }
  }

  reset(): void {
    this.previewUrl    = null;
    this.scanResult    = null;
    this.compareResult = null;
    this.errorMsg      = null;
    this.cdr.detectChanges();
  }

  getStatusIcon(): string {
    switch (this.compareResult?.status) {
      case 'MATCH':        return '✅';
      case 'WRONG_DOSAGE': return '⚠️';
      case 'NOT_FOUND':    return '❌';
      default:             return '❓';
    }
  }

  getStatusLabel(): string {
    switch (this.compareResult?.status) {
      case 'MATCH':        return 'Médicament conforme à la prescription';
      case 'WRONG_DOSAGE': return 'Médicament trouvé mais dosage différent';
      case 'NOT_FOUND':    return 'Médicament non trouvé dans la prescription';
      default:             return 'Résultat inconnu';
    }
  }

  getStatusClass(): string {
    switch (this.compareResult?.status) {
      case 'MATCH':        return 'status--ok';
      case 'WRONG_DOSAGE': return 'status--warn';
      case 'NOT_FOUND':    return 'status--danger';
      default:             return 'status--unknown';
    }
  }
}