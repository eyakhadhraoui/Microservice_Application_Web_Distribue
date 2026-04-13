import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/** Aligné sur prescription-Service (PrescriptionDTO). */
export interface PrescriptionDTO {
  id?: number;
  patientId: number;
  patient_id?: number;  /** Variante snake_case de l'API */
  prescriptionDate: string;
  notes?: string;
  prescriptionItems?: PrescriptionItemDTO[];
}

/** Retourne l'ID patient d'une prescription (patientId ou patient_id) */
export function getPrescriptionPatientId(p: PrescriptionDTO | Record<string, unknown>): number {
  const r = p as Record<string, unknown>;
  const v = r?.['patientId'] ?? r?.['patient_id'];
  return v != null && !isNaN(Number(v)) ? Number(v) : 0;
}

/** Aligné sur prescription-Service (PrescriptionItemDTO). */
export interface PrescriptionItemDTO {
  id?: number;
  prescriptionId: number;
  medicationId: number;
  dosageInstructions: string;
  frequency?: string;
  frequencyPerDay?: number;
  duration?: number | string;
  administrationRoute?: string;
  startDate?: string;
  endDate?: string;
  specialInstructions?: string;
  isPriority?: boolean;
  isImmunosuppressor?: boolean;
  scheduledTimes?: string[];
  medicationName?: string;
  medicationCategory?: string;
  medicationDosage?: string;
  medicationUnit?: string;
  /** Variantes renvoyées par certaines API (snake_case ou alias) */
  dosage?: string;
  dose?: string;
  medication_name?: string;
  administration_route?: string;
  dosage_instructions?: string;
  start_date?: string;
  end_date?: string;
  category?: string;
}

/** Base URL : gateway routes `/api/prescriptions/**`, `/api/prescription-items/**` → prescription-Service. */
@Injectable({ providedIn: 'root' })
export class PrescriptionService {
  private readonly base = '/api';

  constructor(private http: HttpClient) {}

  // ─── Prescriptions ─────────────────────────────────────────────────────────

  getAll(): Observable<PrescriptionDTO[]> {
    return this.http.get<PrescriptionDTO[]>(`${this.base}/prescriptions`).pipe(
      catchError(() => of([]))
    );
  }

  getById(id: number): Observable<PrescriptionDTO> {
    return this.http.get<PrescriptionDTO>(`${this.base}/prescriptions/${id}`);
  }

  getByMedicalRecordId(medicalRecordId: number): Observable<PrescriptionDTO[]> {
    return this.http.get<PrescriptionDTO[]>(`${this.base}/prescriptions/medical-record/${medicalRecordId}`).pipe(
      catchError(() => of([]))
    );
  }

  getRecentByMedicalRecordId(medicalRecordId: number, limit = 5): Observable<PrescriptionDTO[]> {
    return this.http.get<PrescriptionDTO[]>(`${this.base}/prescriptions/medical-record/${medicalRecordId}/recent`, {
      params: { limit: String(limit) }
    }).pipe(catchError(() => of([])));
  }

  getByDateRange(medicalRecordId: number, start: string, end: string): Observable<PrescriptionDTO[]> {
    return this.http.get<PrescriptionDTO[]>(`${this.base}/prescriptions/date-range`, {
      params: { medicalRecordId: String(medicalRecordId), start, end }
    }).pipe(catchError(() => of([])));
  }

  getActiveByMedicalRecordId(medicalRecordId: number): Observable<PrescriptionDTO[]> {
    return this.http.get<PrescriptionDTO[]>(`${this.base}/prescriptions/medical-record/${medicalRecordId}/active`).pipe(
      catchError(() => of([]))
    );
  }

  getActiveByPatient(patientId: number): Observable<PrescriptionDTO[]> {
    return this.http.get<PrescriptionDTO[]>(`${this.base}/prescriptions/patient/${patientId}/active`).pipe(
      catchError(() => of([]))
    );
  }

  getByPatient(patientId: number): Observable<PrescriptionDTO[]> {
    return this.http.get<PrescriptionDTO[]>(`${this.base}/prescriptions/patient/${patientId}`).pipe(
      catchError(() => of([]))
    );
  }

  create(dto: PrescriptionDTO): Observable<PrescriptionDTO> {
    return this.http.post<PrescriptionDTO>(`${this.base}/prescriptions`, dto);
  }

  update(id: number, dto: PrescriptionDTO): Observable<PrescriptionDTO> {
    return this.http.put<PrescriptionDTO>(`${this.base}/prescriptions/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/prescriptions/${id}`);
  }

  // ─── Prescription items ───────────────────────────────────────────────────

  getAllItems(): Observable<PrescriptionItemDTO[]> {
    return this.http.get<PrescriptionItemDTO[]>(`${this.base}/prescription-items`).pipe(
      catchError(() => of([]))
    );
  }

  getItemById(id: number): Observable<PrescriptionItemDTO> {
    return this.http.get<PrescriptionItemDTO>(`${this.base}/prescription-items/${id}`);
  }

  getItemsByPrescription(prescriptionId: number): Observable<PrescriptionItemDTO[]> {
    return this.http.get<PrescriptionItemDTO[]>(`${this.base}/prescription-items/prescription/${prescriptionId}`).pipe(
      catchError(() => of([]))
    );
  }

  getItemsByMedication(medicationId: number): Observable<PrescriptionItemDTO[]> {
    return this.http.get<PrescriptionItemDTO[]>(`${this.base}/prescription-items/medication/${medicationId}`).pipe(
      catchError(() => of([]))
    );
  }

  getPriorityItems(prescriptionId: number): Observable<PrescriptionItemDTO[]> {
    return this.http.get<PrescriptionItemDTO[]>(`${this.base}/prescription-items/prescription/${prescriptionId}/priority`).pipe(
      catchError(() => of([]))
    );
  }

  getActiveItems(date?: string): Observable<PrescriptionItemDTO[]> {
    const options = date != null && date !== ''
      ? { params: new HttpParams().set('date', date) }
      : {};
    return this.http.get<PrescriptionItemDTO[]>(`${this.base}/prescription-items/active`, options).pipe(
      catchError((): Observable<PrescriptionItemDTO[]> => of([]))
    );
  }

  createItem(dto: PrescriptionItemDTO): Observable<PrescriptionItemDTO> {
    return this.http.post<PrescriptionItemDTO>(`${this.base}/prescription-items`, dto);
  }

  updateItem(id: number, dto: PrescriptionItemDTO): Observable<PrescriptionItemDTO> {
    return this.http.put<PrescriptionItemDTO>(`${this.base}/prescription-items/${id}`, dto);
  }

  deleteItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/prescription-items/${id}`);
  }
}
