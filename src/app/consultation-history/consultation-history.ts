import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../services/notification.service';

interface Consultation {
  id: number;
  date: Date;
  doctor: string;
  specialty: string;
  reason: string;
  diagnosis: string;
  treatment: string;
  prescriptions?: string[];
  followUp?: string;
  notes?: string;
}

@Component({
  selector: 'app-consultation-history',
  standalone: false,
  templateUrl: './consultation-history.html',
  styleUrl: './consultation-history.css'
})
export class ConsultationHistory implements OnInit {

  constructor(private notification: NotificationService) {}

  childName: string = 'Ahmed Ben Ali';
  consultations: Consultation[] = [];
  filteredConsultations: Consultation[] = [];

  ngOnInit() {
    this.loadConsultations();
    this.filteredConsultations = this.consultations;
  }

  loadConsultations() {
    this.consultations = [
      {
        id: 1,
        date: new Date('2026-02-08'),
        doctor: 'Dr. Sarah Ahmed',
        specialty: 'Nephrologist',
        reason: 'Regular Check-up',
        diagnosis: 'Chronic Kidney Disease Stage 3 - Stable condition',
        treatment: 'Continue current medication regimen with adjusted dosage',
        prescriptions: ['Lisinopril 10mg - Once daily', 'Vitamin D supplement'],
        followUp: 'Next visit scheduled in 2 weeks for blood work review',
        notes: 'Patient showing improvement. Blood pressure under control.'
      },
      {
        id: 2,
        date: new Date('2026-01-25'),
        doctor: 'Dr. Mohamed Khalil',
        specialty: 'Pediatric Nephrologist',
        reason: 'Blood Test Follow-up',
        diagnosis: 'Elevated potassium levels (Hyperkalemia)',
        treatment: 'Dietary modifications recommended - Low potassium diet',
        prescriptions: ['Sodium polystyrene sulfonate - As needed'],
        followUp: 'Blood test in 1 week to monitor potassium levels',
        notes: 'URGENT: Avoid high-potassium foods. Detailed diet plan provided.'
      },
      {
        id: 3,
        date: new Date('2026-01-15'),
        doctor: 'Dr. Sarah Ahmed',
        specialty: 'Nephrologist',
        reason: 'Routine Follow-up',
        diagnosis: 'Chronic Kidney Disease - Monitoring required',
        treatment: 'Medication adjustment and lifestyle counseling',
        prescriptions: ['Furosemide 20mg - Twice daily', 'Calcium supplement'],
        followUp: 'Return in 3 weeks',
        notes: 'Discussed fluid intake management with family.'
      },
      {
        id: 4,
        date: new Date('2025-12-20'),
        doctor: 'Dr. Amira Mansour',
        specialty: 'Pediatrician',
        reason: 'General Health Check',
        diagnosis: 'Overall health stable, kidney function requires monitoring',
        treatment: 'Continue current treatment plan',
        prescriptions: ['Multivitamin supplement'],
        followUp: 'Schedule with nephrologist in January',
        notes: 'Growth and development on track. Family well-informed.'
      }
    ];
  }

  printConsultation(id: number) {
    console.log('Printing consultation:', id);
    window.print();
  }

  downloadConsultation(id: number) {
    console.log('Downloading consultation:', id);
    this.notification.info('Downloading consultation report PDF…');
  }
}