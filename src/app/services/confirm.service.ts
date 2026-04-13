import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ConfirmOptions {
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

/** Payload émis par open$ : tous les champs requis pour l’affichage. */
export interface ConfirmPayload {
  message: string;
  title: string;
  confirmLabel: string;
  cancelLabel: string;
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly open$ = new Subject<ConfirmPayload>();

  /** Ouvre une boîte de confirmation. Retourne une Promise qui résout à true (OK) ou false (Annuler). */
  confirm(message: string, options?: Partial<ConfirmOptions>): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const payload: ConfirmPayload = {
        message,
        title: options?.title ?? 'Confirm',
        confirmLabel: options?.confirmLabel ?? 'OK',
        cancelLabel: options?.cancelLabel ?? 'Cancel',
        resolve,
      };
      this.open$.next(payload);
    });
  }
}
