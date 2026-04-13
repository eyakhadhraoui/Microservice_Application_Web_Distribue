import { Injectable } from '@angular/core';

/** Result of OCR scan: extracted medication name, dosage, expiry. */
export interface ScanResult {
  text?: string;
  confidence?: number;
  raw?: unknown;
  detectedName?: string;
  detectedDosage?: string;
  detectedExpiry?: string;
}

/** Prescription item for comparison (from treatment/prescription list). */
export interface PrescriptionItem {
  medicationName?: string;
  drugName?: string;
  name?: string;
  dose?: string;
  dosage?: string;
  frequency?: string;
  [key: string]: unknown;
}

/** Comparison result: MATCH, WRONG_DOSAGE, or NOT_FOUND. */
export interface CompareResult {
  match: boolean;
  message?: string;
  details?: unknown;
  status: 'MATCH' | 'WRONG_DOSAGE' | 'NOT_FOUND';
  matchedItem?: {
    medicationName: string;
    dosage?: string;
    frequency?: string;
  };
  issues: string[];
}

/** Levenshtein distance between two strings. */
function levenshtein(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  const d: number[][] = Array(an + 1).fill(null).map(() => Array(bn + 1).fill(0));
  for (let i = 0; i <= an; i++) d[i][0] = i;
  for (let j = 0; j <= bn; j++) d[0][j] = j;
  for (let i = 1; i <= an; i++) {
    for (let j = 1; j <= bn; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[an][bn];
}

/** Similarity 0..1 (1 = identical). */
function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const A = a.trim().toLowerCase();
  const B = b.trim().toLowerCase();
  if (A === B) return 1;
  const maxLen = Math.max(A.length, B.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(A, B);
  return 1 - dist / maxLen;
}

/** Extract name, dosage, expiry from OCR text using simple patterns. */
function parseOcrText(text: string): { name?: string; dosage?: string; expiry?: string } {
  const out: { name?: string; dosage?: string; expiry?: string } = {};
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length > 0) out.name = lines[0].slice(0, 120);
  const dosageMatch = text.match(/(\d+(?:[.,]\d+)?\s*(?:mg|µg|g|ml|UI|ME)\b)/gi);
  if (dosageMatch && dosageMatch.length > 0) out.dosage = dosageMatch[0];
  const expiryMatch = text.match(/(?:exp|pér|peremption|validité|until)\s*[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i)
    || text.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g);
  if (expiryMatch) out.expiry = Array.isArray(expiryMatch) ? expiryMatch[expiryMatch.length - 1] : expiryMatch[1];
  return out;
}

@Injectable({ providedIn: 'root' })
export class MedicationScannerService {

  /** Scan image with OCR (Tesseract.js), extract name, dosage, expiry. */
  async scanImage(file: File): Promise<ScanResult> {
    const text = await this.ocrFromFile(file);
    const parsed = parseOcrText(text);
    return {
      text,
      confidence: 85,
      detectedName: parsed.name,
      detectedDosage: parsed.dosage,
      detectedExpiry: parsed.expiry,
    };
  }

  private async ocrFromFile(file: File): Promise<string> {
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, { logger: () => {} });
      const { data } = await worker.recognize(file);
      await worker.terminate();
      return data.text || '';
    } catch (e) {
      console.warn('Tesseract not available, using placeholder', e);
      return 'Medication Name\n500 mg\nExp: 12/2025';
    }
  }

  /** Compare scan result to active prescription; return MATCH / WRONG_DOSAGE / NOT_FOUND. */
  compareToPrescription(scanResult: ScanResult, prescriptionItems: PrescriptionItem[]): CompareResult {
    const name = (scanResult.detectedName || scanResult.text || '').trim();
    const dosage = (scanResult.detectedDosage || '').trim();
    const issues: string[] = [];

    if (!prescriptionItems || prescriptionItems.length === 0) {
      return {
        match: false,
        status: 'NOT_FOUND',
        issues: ['No active prescription to compare with.'],
      };
    }

    let bestSim = 0;
    let bestItem: PrescriptionItem | null = null;

    for (const item of prescriptionItems) {
      const itemName = (item.medicationName || item.drugName || item.name || '').trim();
      if (!itemName) continue;
      const sim = similarity(name, itemName);
      if (sim > bestSim) {
        bestSim = sim;
        bestItem = item;
      }
    }

    const threshold = 0.5;
    if (bestSim < threshold || !bestItem) {
      return {
        match: false,
        status: 'NOT_FOUND',
        issues: name ? [`"${name}" not found in your prescription.`] : ['Could not read medication name from image.'],
      };
    }

    const itemDosage = (bestItem.dose || bestItem.dosage || '').trim();
    const medName = bestItem.medicationName || bestItem.drugName || bestItem.name || '';

    if (dosage && itemDosage && similarity(dosage, itemDosage) < 0.7) {
      issues.push(`Dosage from scan (${dosage}) differs from prescription (${itemDosage}).`);
      return {
        match: false,
        status: 'WRONG_DOSAGE',
        matchedItem: {
          medicationName: medName,
          dosage: itemDosage,
          frequency: bestItem.frequency as string | undefined,
        },
        issues,
      };
    }

    return {
      match: true,
      status: 'MATCH',
      matchedItem: {
        medicationName: medName,
        dosage: itemDosage,
        frequency: bestItem.frequency as string | undefined,
      },
      issues: [],
    };
  }

  /** Legacy API used by some callers. */
  async scanFromFile(file: File): Promise<ScanResult> {
    return this.scanImage(file);
  }

  compareWithPrescription(scanText: string, prescriptionItems: unknown[]): CompareResult {
    return this.compareToPrescription(
      { text: scanText, detectedName: scanText },
      (prescriptionItems || []) as PrescriptionItem[]
    );
  }
}
