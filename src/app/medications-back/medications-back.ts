import { Component, OnInit } from '@angular/core';
import { MedicationService, MedicationDTO } from '../services/medication';

@Component({
  selector: 'app-medications-back',
  standalone: false,
  templateUrl: './medications-back.html',
  styleUrls: ['./medications-back.css'],
})
export class MedicationsBackComponent implements OnInit {
  medications: MedicationDTO[] = [];
  loading = true;
  error: string | null = null;

  constructor(private medicationService: MedicationService) {}

  ngOnInit(): void {
    this.loadMedications();
  }

  loadMedications(): void {
    this.loading = true;
    this.error = null;
    this.medicationService.getAllMedications().subscribe({
      next: (list) => {
        this.medications = list || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.message || 'Failed to load medications.';
        this.medications = this.getMockMedications();
        this.loading = false;
      },
    });
  }

  private getMockMedications(): MedicationDTO[] {
    return [
      { name: 'Tacrolimus', dosage: '2 mg', unit: 'mg', form: 'Capsule', activeIngredient: 'Tacrolimus', category: 'Immunosuppressant', requiresMonitoring: true },
      { name: 'Mycophenolate Mofetil', dosage: '500 mg', unit: 'mg', form: 'Tablet', activeIngredient: 'Mycophenolate', category: 'Immunosuppressant', requiresMonitoring: false },
      { name: 'Prednisone', dosage: '5 mg', unit: 'mg', form: 'Tablet', activeIngredient: 'Prednisone', category: 'Corticosteroid', requiresMonitoring: false },
      { name: 'Lisinopril', dosage: '10 mg', unit: 'mg', form: 'Tablet', activeIngredient: 'Lisinopril', category: 'ACE inhibitor', requiresMonitoring: false },
      { name: 'Vitamin D', dosage: '1000 UI', unit: 'UI', form: 'Capsule', activeIngredient: 'Cholecalciferol', category: 'Supplement', requiresMonitoring: false },
    ];
  }
}
