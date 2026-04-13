import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/** Service pour ouvrir la modal Prescriptions depuis n'importe où (ex: page Home). */
@Injectable({ providedIn: 'root' })
export class PrescriptionModalService {
  private open$ = new Subject<void>();
  onOpen = this.open$.asObservable();

  open(): void {
    this.open$.next();
  }
}
