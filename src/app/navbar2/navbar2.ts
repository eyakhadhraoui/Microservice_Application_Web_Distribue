import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { KEYCLOAK_ROLES } from '../auth/keycloak-roles';
import { DashboardNotificationService } from '../services/dashboard-notification.service';

@Component({
  selector: 'app-navbar2',
  standalone: false,
  templateUrl: './navbar2.html',
  styleUrl: './navbar2.css',
})
export class Navbar2 implements OnInit {
  showMobileMenu = false;
  /** Nombre de nouveaux tests (badge cloche) — fourni par le dashboard */
  newTestsCount$: Observable<number>;
  /** Profil de l'utilisateur connecté (nom, username, etc.) */
  profile: { username?: string; name?: string; email?: string } | null = null;
  /** Libellé du rôle affiché (même vocabulaire que Keycloak : patient, medecin) */
  roleLabel = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private dashboardNotificationService: DashboardNotificationService
  ) {
    this.newTestsCount$ = this.dashboardNotificationService.newTestsCount$;
  }

  ngOnInit(): void {
    this.profile = this.auth.getProfile();
    if (this.auth.hasRole([KEYCLOAK_ROLES.medecin])) {
      this.roleLabel = 'medecin';
    } else if (this.auth.hasRole([KEYCLOAK_ROLES.patient])) {
      this.roleLabel = 'patient';
    } else {
      this.roleLabel = '';
    }
  }

  /** Initiales pour l'avatar (nom ou username) */
  get initials(): string {
    if (!this.profile) return '';
    const name = (this.profile.name || this.profile.username || '').trim();
    if (!name) return (this.profile.username || '').charAt(0).toUpperCase() || '?';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  /** Nom ou username à afficher */
  get displayName(): string {
    if (!this.profile) return 'Not connected';
    return (this.profile.name || this.profile.username || 'Utilisateur').trim();
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  goToConsultations(): void {
    this.router.navigate(['/back']);
  }
}

