import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RegisterService, RegisterRequest } from '../services/register';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class Register {
  model: RegisterRequest = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    birthDate: '',
    password: '',
    role: 'patient',
  };
  confirmPassword = '';
  phone = '';
  loading = false;
  error = '';
  success = '';

  constructor(
    private registerService: RegisterService,
    private router: Router,
  ) {}

  onSubmit() {
    this.error = '';
    if (this.model.password !== this.confirmPassword) {
      this.error = 'Les mots de passe ne correspondent pas.';
      return;
    }
    this.loading = true;
    this.success = '';
    this.registerService.register(this.model).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Compte créé. Vous pouvez vous connecter.';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.loading = false;
        const raw = err?.error;
        let msg: string | null = null;
        if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) {
          const b = raw as Record<string, unknown>;
          const errs = b['errors'];
          if (Array.isArray(errs) && errs.length > 0 && errs[0] && typeof errs[0] === 'object') {
            const m = (errs[0] as Record<string, unknown>)['message'];
            if (typeof m === 'string') msg = m;
          }
          if (!msg && typeof b['message'] === 'string') msg = b['message'];
          const detail = b['detail'];
          if (typeof detail === 'string' && detail.trim() !== '') {
            const short = detail.length > 320 ? detail.slice(0, 320) + '…' : detail;
            msg = msg ? `${msg} (${short})` : short;
          }
          const hint = b['hint'];
          if (typeof hint === 'string' && hint.trim() !== '') {
            msg = msg ? `${msg} — ${hint}` : hint;
          }
          if (b['source'] === 'keycloak' && msg && !String(msg).startsWith('Keycloak')) {
            msg = `Keycloak : ${msg}`;
          }
        } else if (typeof raw === 'string' && raw.length > 0) {
          msg = raw.length > 280 ? raw.slice(0, 280) + '…' : raw;
        }
        const status = Number(err?.status);
        if (!msg && [500, 502, 503, 504].includes(status)) {
          msg =
            status === 502 || status === 503
              ? 'Keycloak ou réseau : le serveur Symfony répond mais Keycloak est injoignable ou mal configuré (KEYCLOAK_BASE_URL, admin, rôle patient).'
              : 'Connexion impossible au user-service (http://127.0.0.1:8000). Démarrez Symfony CLI et PostgreSQL.';
        }
        this.error =
          msg ??
          (typeof err?.message === 'string' ? err.message : null) ??
          "Erreur d'inscription (voir l'onglet Network du navigateur).";
      },
    });
  }
}
