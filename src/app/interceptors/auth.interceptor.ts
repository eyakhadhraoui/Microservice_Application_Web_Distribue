import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private readonly injector: Injector,
    private readonly router: Router,
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const url = req.url;
    const skipAuthHeader =
      url.includes('/api/auth/login') ||
      url.includes('/api/auth/register') ||
      url.includes('/api/auth/refresh');

    const auth = this.injector.get(AuthService);

    const send$ = (): Observable<HttpEvent<unknown>> => {
      let outgoing = req;
      if (!skipAuthHeader) {
        const token = auth.getToken()?.trim();
        if (token) {
          outgoing = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
          });
        }
      }

      return next.handle(outgoing).pipe(
        catchError((err: HttpErrorResponse) => {
          const sentBearer = outgoing.headers.has('Authorization');
          if (err.status === 401 && !skipAuthHeader) {
            if (sentBearer) {
              auth.clearStoredToken();
              this.router.navigate(['/login'], { queryParams: { expired: '1' } });
            } else {
              this.router.navigate(['/login'], { queryParams: { required: '1' } });
            }
          }
          return throwError(() => err);
        }),
      );
    };

    if (skipAuthHeader) {
      return send$();
    }

    return from(auth.ensureValidAccessToken()).pipe(
      catchError(() => of(undefined)),
      switchMap(() => {
        if (!auth.getToken()?.trim()) {
          this.router.navigate(['/login'], { queryParams: { required: '1' } });
          return throwError(
            () =>
              new HttpErrorResponse({
                status: 401,
                statusText: 'Unauthorized',
                url: req.url,
                error: { message: 'Session expirée ou absente. Reconnectez-vous.' },
              }),
          );
        }
        return send$();
      }),
    );
  }
}
