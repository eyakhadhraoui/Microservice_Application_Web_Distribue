import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/** Service to open the appointment modal from anywhere (e.g. Home page). */
@Injectable({ providedIn: 'root' })
export class AppointmentModalService {
  private open$ = new Subject<void>();
  onOpen = this.open$.asObservable();

  open(): void {
    this.open$.next();
  }
}
