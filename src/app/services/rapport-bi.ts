import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { jsPDF } from 'jspdf';

export interface RapportBi {
  idRapportBilan?: number;
  /** Un seul résultat (optionnel si resultatsIds est utilisé). */
  idResultatLaboratoire?: number;
  /** Liste des IDs des résultats inclus dans ce rapport. */
  resultatsIds?: number[];
  idDossierMedical: number;
  dateRapport: string;
  contenu?: string;
  conclusion?: string;
  recommandations?: string;
  cheminPdf?: string;
  signatureBase64?: string;
  dateSignature?: string;
  nomMedecin?: string;
  /** La famille peut-elle voir ce rapport ? */
  partagePatient?: boolean;
}

export interface ExportPdfOptions {
  patientName?: string;
}

@Injectable({ providedIn: 'root' })
export class RapportBiService {
  private apiUrl = '/api/rapports-bi';

  constructor(private http: HttpClient) {}

  create(dto: RapportBi): Observable<RapportBi> {
    return this.http.post<RapportBi>(this.apiUrl, dto).pipe(
      catchError(err => {
        const msg = err?.error?.message ?? err?.message ?? 'Erreur création rapport';
        return throwError(() => ({ message: msg, error: err?.error }));
      })
    );
  }

  update(id: number, dto: RapportBi): Observable<RapportBi> {
    return this.http.put<RapportBi>(`${this.apiUrl}/${id}`, dto).pipe(
      catchError(err => throwError(() => ({ message: err?.error?.message ?? err?.message ?? 'Erreur mise à jour' })))
    );
  }

  getByBilan(idResultatLaboratoire: number): Observable<RapportBi[]> {
    return this.http.get<RapportBi[]>(`${this.apiUrl}/bilan/${idResultatLaboratoire}`).pipe(
      catchError(err => throwError(() => ({ message: err?.error?.message ?? err?.message ?? 'Erreur chargement' })))
    );
  }

  getByDossier(idDossierMedical: number): Observable<RapportBi[]> {
    return this.http.get<RapportBi[]>(`${this.apiUrl}/dossier/${idDossierMedical}`).pipe(
      catchError(err => throwError(() => ({ message: err?.error?.message ?? err?.message ?? 'Erreur chargement' })))
    );
  }

  getById(id: number): Observable<RapportBi> {
    return this.http.get<RapportBi>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => throwError(() => ({ message: err?.error?.message ?? err?.message ?? 'Erreur' })))
    );
  }

  getPdfUrl(id: number): string {
    return `${this.apiUrl}/${id}/pdf`;
  }

  getPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' }).pipe(
      catchError(err => throwError(() => ({ message: err?.error?.message ?? err?.message ?? 'PDF indisponible' })))
    );
  }

  exportRapportAsPdf(rap: RapportBi, options?: ExportPdfOptions): void {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 22;
    const maxWidth = pageWidth - 2 * margin;
    const lineHeight = 5;
    const footerY = pageHeight - 18;
    const state = { y: 28, pageNum: 1 };

    const patientName = options?.patientName || '—';

    const drawHeader = () => {
      doc.setFillColor(14, 165, 233);
      doc.rect(0, 0, pageWidth, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('KidneyCare', margin, 14);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Rapport de bilan', pageWidth - margin - doc.getTextWidth('Rapport de bilan'), 14);
      doc.setTextColor(0, 0, 0);
    };

    const drawFooter = (pageNum: number) => {
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text('KidneyCare', margin, footerY + 4);
      doc.text(`Page ${pageNum}`, pageWidth - margin - doc.getTextWidth(`Page ${pageNum}`), footerY + 4);
      doc.setTextColor(0, 0, 0);
    };

    const maybeNewPage = () => {
      if (state.y > footerY - 20) {
        drawFooter(state.pageNum);
        doc.addPage();
        state.pageNum += 1;
        drawHeader();
        state.y = 28;
      }
    };

    const addSection = (
      label: string,
      text: string,
      titleColor: [number, number, number],
      lineColor: [number, number, number]
    ) => {
      if (!text || !text.trim()) return;
      maybeNewPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
      doc.text(label, margin, state.y);
      state.y += 4;
      doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, state.y, pageWidth - margin, state.y);
      state.y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      const lines = doc.splitTextToSize(text.trim(), maxWidth);
      for (const line of lines) {
        maybeNewPage();
        doc.text(line, margin, state.y);
        state.y += lineHeight;
      }
      state.y += 6;
      doc.setTextColor(0, 0, 0);
    };

    const sections: Array<{ label: string; text: string; titleColor: [number, number, number]; lineColor: [number, number, number] }> = [
      { label: 'Contenu', text: rap.contenu || '', titleColor: [7, 89, 133], lineColor: [147, 197, 253] },
      { label: 'Conclusion', text: rap.conclusion || '', titleColor: [20, 83, 45], lineColor: [134, 239, 172] },
      { label: 'Recommandations', text: rap.recommandations || '', titleColor: [146, 64, 14], lineColor: [253, 230, 138] }
    ];

    drawHeader();
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapport de bilan', margin, state.y);
    state.y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Date du rapport : ${rap.dateRapport || '—'}`, margin, state.y);
    state.y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text(`Patient : ${patientName}`, margin, state.y);
    state.y += 10;

    for (const s of sections) {
      addSection(s.label, s.text, s.titleColor, s.lineColor);
    }

    maybeNewPage();
    state.y += 8;
    const signatureB64 = (rap as any).signatureBase64 ?? (rap as any).signature_base64;
    if (signatureB64 && typeof signatureB64 === 'string' && signatureB64.length > 100) {
      try {
        const imgW = 50;
        const imgH = 22;
        const nomMedecin = (rap as any).nomMedecin ?? (rap as any).nom_medecin ?? 'Médecin';
        const dateSig = (rap as any).dateSignature ?? (rap as any).date_signature;
        let dateSigStr = '—';
        if (dateSig) {
          try {
            if (typeof dateSig === 'string') dateSigStr = new Date(dateSig).toLocaleString('fr-FR');
            else if (Array.isArray(dateSig)) dateSigStr = new Date(dateSig[0], (dateSig[1] ?? 1) - 1, dateSig[2] ?? 1, dateSig[3] ?? 0, dateSig[4] ?? 0, dateSig[5] ?? 0).toLocaleString('fr-FR');
            else if (typeof dateSig === 'object' && dateSig !== null) dateSigStr = new Date((dateSig as any).year ?? 0, ((dateSig as any).monthValue ?? (dateSig as any).month ?? 1) - 1, (dateSig as any).dayOfMonth ?? (dateSig as any).day ?? 1).toLocaleString('fr-FR');
          } catch { dateSigStr = '—'; }
        }
        const imgData = signatureB64.indexOf('base64,') !== -1 ? signatureB64 : `data:image/png;base64,${signatureB64}`;
        doc.addImage(imgData, 'PNG', margin, state.y - 5, imgW, imgH);
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(nomMedecin, margin, state.y + imgH + 4);
        doc.text(`Signé le ${dateSigStr}`, margin, state.y + imgH + 9);
        doc.setTextColor(0, 0, 0);
        state.y += imgH + 14;
      } catch (err) {
        console.warn('Export PDF: signature image failed', err);
        doc.setDrawColor(100, 100, 100);
        doc.line(margin, state.y, margin + 50, state.y);
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('Signature', margin, state.y + 6);
        doc.setTextColor(0, 0, 0);
      }
    } else {
      doc.setDrawColor(100, 100, 100);
      doc.line(margin, state.y, margin + 50, state.y);
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Signature', margin, state.y + 6);
      doc.setTextColor(0, 0, 0);
    }

    drawFooter(state.pageNum);
    const fileName = `rapport-${(rap.dateRapport || 'export').replace(/\s/g, '-')}.pdf`;
    doc.save(fileName);
  }
}
