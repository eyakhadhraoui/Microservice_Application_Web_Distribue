import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { KEYCLOAK_ROLES } from '../auth/keycloak-roles';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  username = '';
  password = '';
  loading = false;
  error = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    if (this.route.snapshot.queryParams['expired'] === '1') {
      this.error = 'Session expirée. Veuillez vous reconnecter.';
    }
    if (this.route.snapshot.queryParams['required'] === '1') {
      this.error = 'Connexion requise pour accéder à cette page.';
    }
    if (this.auth.isLoggedIn()) {
      if (this.auth.hasRole([KEYCLOAK_ROLES.medecin])) {
        this.router.navigate(['/back']);
      } else {
        this.router.navigate(['/home']);
      }
    }
  }

  loginKeycloak() {
    this.loading = true;
    this.error = '';
    this.auth.login().then(() => {
      this.loading = false;
    }).catch(() => {
      this.loading = false;
    });
  }

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.auth.loginWithCredentials(this.username.trim(), this.password).then(() => {
      this.loading = false;
      if (this.auth.hasRole([KEYCLOAK_ROLES.medecin])) {
        this.router.navigate(['/back']);
      } else {
        this.router.navigate(['/home']);
      }
    }).catch((err) => {
      this.loading = false;
      console.error('Login error', err?.status, err?.error, err?.message);
      const status = Number(err?.status);
      let msg: string | null =
        typeof err?.error?.message === 'string' ? err.error.message : null;
      if (!msg && typeof err?.message === 'string' && !String(err.message).startsWith('Http failure')) {
        msg = err.message;
      }
      if (!msg && status === 503) {
        msg =
          'Keycloak injoignable ou erreur serveur d’auth : vérifiez Keycloak (souvent http://localhost:8081 avec Docker) et keycloak-config.url.';
      } else if (!msg && [500, 502, 504].includes(status)) {
        msg =
          'Service injoignable : démarrez Symfony (http://127.0.0.1:8000), la Gateway (8095) et Keycloak.';
      }
      this.error =
        msg ??
        'Identifiant ou mot de passe incorrect, ou Keycloak mal configuré (Direct access grants pour le client).';
    });
  }
}
