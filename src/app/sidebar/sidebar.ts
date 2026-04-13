import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ConfirmService } from '../services/confirm.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
  standalone: false,
})
export class Sidebar {
  constructor(
    private router: Router,
    private auth: AuthService,
    private confirmService: ConfirmService,
  ) {}

  logout() {
    this.confirmService.confirm('Are you sure you want to log out?', { title: 'Log out' }).then((ok) => {
      if (!ok) return;
      this.auth.logout(window.location.origin + '/home').then(() => {
        this.router.navigate(['/login']);
      });
    });
  }

  openAppointmentForm(): void {
    // TODO: open appointment modal or navigate – currently no modal in layout
  }

  openLabResultForm(): void {
    // TODO: open lab result modal or navigate – currently no modal in layout
  }

  openEmergencyForm(): void {
    // TODO: open emergency modal or navigate – currently no modal in layout
  }
}