import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // ✅ Ne pas intercepter les routes d'authentification
  if (req.url.includes('/api/auth')) {
    return next(req);
  }

  // ✅ Rafraîchir le token AVANT d'envoyer la requête
  return from(auth.ensureValidAccessToken()).pipe(
    switchMap(() => {
      const token = auth.getToken();

      // ✅ Si toujours pas de token → rediriger vers login
      if (!token) {
        router.navigate(['/login']);
        return throwError(() => new Error('Non authentifié'));
      }

      // ✅ Ajouter le token à la requête
      const authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });

      return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          // ✅ Token expiré pendant la requête → vider et rediriger
          if (error.status === 401) {
            auth.clearStoredToken();
            router.navigate(['/login']);
          }
          return throwError(() => error);
        })
      );
    })
  );
};