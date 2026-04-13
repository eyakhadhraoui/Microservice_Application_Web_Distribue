import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  /** Format AAAA-MM-JJ (input type="date") */
  birthDate: string;
  password: string;
  role?: string;
}

@Injectable({ providedIn: 'root' })
export class RegisterService {
  /** URL relative : proxy redirige /api vers le backend */
  private apiUrl = '/api/auth';

  constructor(private http: HttpClient) {}

  register(data: RegisterRequest): Observable<{ message: string; idPatient?: number; username?: string }> {
    const trim = (s: string | undefined) => (typeof s === 'string' ? s.trim() : '');
    const payload = {
      username: trim(data.username),
      password: data.password != null ? String(data.password) : '',
      email: trim(data.email),
      firstName: trim(data.firstName),
      lastName: trim(data.lastName),
      birthDate: trim(data.birthDate),
    };
    return this.http.post<{ message: string; idPatient?: number; username?: string }>(
      `${this.apiUrl}/register`,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}