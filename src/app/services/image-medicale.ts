import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

export interface ImageMedicale {
  idImage?: number;
  idDossierMedical?: number;
  typeImage: string;
  cheminImage?: string;
  dateCapture: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImageMedicaleService {
  /** URL ABSOLUE : backend Spring Boot. */
  private apiUrl = '/api/images-medicales';

  constructor(private http: HttpClient) {}

  /**
   * Upload un fichier image et retourne le chemin servi par le backend.
   */
  uploadFile(file: File): Observable<{ path: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ path: string }>(`${this.apiUrl}/upload`, formData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Créer une nouvelle image médicale (liée au dossier médical).
   * Après upload du fichier via uploadFile(), passer le chemin dans image.cheminImage.
   */
  createImageMedicale(idDossierMedical: number, image: ImageMedicale, file?: File): Observable<ImageMedicale> {
    const payload = {
      idDossierMedical,
      typeImage: image.typeImage,
      cheminImage: image.cheminImage || (file ? `uploads/${file.name}` : ''),
      dateCapture: image.dateCapture,
      description: image.description ?? ''
    };
    return this.http.post<any>(`${this.apiUrl}`, payload).pipe(
      map(response => this.mapToFrontend(response)),
      tap(data => console.log('✅ Image créée:', data)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupérer toutes les images d'un dossier médical
   */
  getImagesByDossier(idDossierMedical: number): Observable<ImageMedicale[]> {
    const url = `${this.apiUrl}/dossier/${idDossierMedical}`;
    return this.http.get<any[]>(url).pipe(
      map(images => images.map(img => this.mapToFrontend(img))),
      tap(data => console.log('✅ Images récupérées:', data.length, 'image(s)')),
      catchError(this.handleError)
    );
  }


  /**
   * Supprimer une image médicale
   */
  deleteImage(idImage: number): Observable<void> {
    console.log('🗑️ Suppression image:', idImage);
    
    return this.http.delete<void>(`${this.apiUrl}/${idImage}`).pipe(
      tap(() => console.log('✅ Image supprimée:', idImage)),
      catchError(this.handleError)
    );
  }

  /**
   * Mapper les données du backend vers le frontend
   */
  private mapToFrontend(dto: any): ImageMedicale {
    if (!dto) {
      return {
        typeImage: 'ECHOGRAPHIE_RENALE',
        dateCapture: new Date().toISOString().split('T')[0],
        description: ''
      };
    }

    console.log('🔄 Image DTO reçu:', dto);
    
    return {
      idImage: dto.idImage ?? dto.id_image ?? undefined,
      idDossierMedical: dto.idDossierMedical ?? dto.id_dossier_medical ?? undefined,
      typeImage: dto.typeImage ?? dto.type_image ?? 'ECHOGRAPHIE_RENALE',
      cheminImage: dto.cheminImage ?? dto.chemin_image ?? '',
      dateCapture: dto.dateCapture ?? dto.date_capture ?? new Date().toISOString().split('T')[0],
      description: dto.description ?? ''
    };
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse) {
    console.error('═══════════════════════════════════════');
    console.error('❌ ERREUR IMAGE MÉDICALE');
    console.error('   Status:', error.status);
    console.error('   URL:', error.url);
    console.error('   Error body:', error.error);
    console.error('═══════════════════════════════════════');
    
    let msg = 'Erreur serveur';
    
    if (error.status === 0) {
      msg = 'Impossible de contacter le serveur backend';
    } else if (error.status === 413) {
      msg = 'Le fichier est trop volumineux (max 10MB)';
    } else if (error.status === 415) {
      msg = 'Format de fichier non supporté. Veuillez vérifier la configuration du serveur.';
    } else if (error.error) {
      if (typeof error.error === 'string') {
        msg = error.error;
      } else if (error.error.message) {
        msg = error.error.message;
      } else if (error.error.error) {
        msg = error.error.error;
      } else if (error.statusText) {
        msg = `${error.status}: ${error.statusText}`;
      } else {
        msg = JSON.stringify(error.error);
      }
    }
    
    console.error('📭 Message d\'erreur final:', msg);
    return throwError(() => new Error(msg));
  }
}