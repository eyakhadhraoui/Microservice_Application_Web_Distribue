# Medication Scanner Architecture (OCR + Prescription Comparison)

## Overview

The medication scanner allows patients to upload or drag-and-drop an image of a medication (box, leaflet), runs **OCR (Tesseract.js)** to extract text, then **compares** the detected name and dosage against the **active prescription** using **Levenshtein similarity**. The result is one of: **MATCH**, **WRONG_DOSAGE**, or **NOT_FOUND**.

## Flow

1. **Upload / drag & drop** image (JPG, PNG, etc.) in the scanner UI (`/home/scanner` or embedded in Treatments).
2. **OCR (Tesseract.js)** runs in the browser on the image and returns raw text.
3. **Extraction**: From the OCR text we parse:
   - **Name**: first line or first significant line.
   - **Dosage**: pattern `\d+(?:[.,]\d+)?\s*(?:mg|µg|g|ml|UI|ME)`.
   - **Expiry**: date patterns (e.g. Exp: 12/2025, or dd/mm/yyyy).
4. **Comparison** with active prescription (list of items with `medicationName`/`drugName`/`name`, `dose`/`dosage`, `frequency`):
   - **Levenshtein similarity** between detected name and each prescription item name.
   - Best match above threshold (e.g. 0.5) → candidate.
   - If dosage differs (similarity &lt; 0.7) → **WRONG_DOSAGE**.
   - If dosage matches or not checked → **MATCH**.
   - If no match above threshold → **NOT_FOUND**.
5. **UI** shows: detected name/dosage/expiry, then status (MATCH / WRONG_DOSAGE / NOT_FOUND) and optional matched prescription item and issues list.

## Key Files

- **Service**: `src/app/services/medication-scanner.service.ts`
  - `scanImage(file: File)`: runs Tesseract.js, parses text, returns `ScanResult` (detectedName, detectedDosage, detectedExpiry, confidence).
  - `compareToPrescription(scanResult, prescriptionItems)`: Levenshtein comparison, returns `CompareResult` (status, matchedItem, issues).
- **Component**: `src/app/medication-scanner/medication-scanner.component.ts`
  - Uses the service for scan and compare; displays result with MATCH / WRONG_DOSAGE / NOT_FOUND.
- **Route**: Patient area → `/home/scanner` (Medication scanner).

## Status Values

| Status          | Meaning |
|-----------------|--------|
| **MATCH**       | Medication name (and dosage if present) matches an item in the active prescription. |
| **WRONG_DOSAGE**| Name matches but dosage differs from prescription. |
| **NOT_FOUND**   | No prescription item matched above the similarity threshold. |

## Dependencies

- **tesseract.js** (npm): browser-side OCR. Loaded dynamically so the app can run without it (fallback placeholder text for demo).

## Levenshtein Similarity

Similarity = `1 - (levenshtein(a, b) / max(a.length, b.length))`. Strings are normalized (trim, lower case). Thresholds: name match ≥ 0.5; dosage match ≥ 0.7 for MATCH.
