import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Microservice utilisateur Symfony (PostgreSQL), via proxy → Gateway (8095) → `/api/users`.
 * Nécessite un JWT Keycloak (intercepteur Bearer).
 */
export interface RegistryUserDto {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  specialty: string | null;
  licenseNumber: string | null;
  service: string | null;
  birthDate: string | null;
  gender: string | null;
  bloodGroup: string | null;
  socialSecurityNumber: string | null;
  keycloakId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type RegistryUserCreatePayload = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'patient' | 'medecin';
  phone?: string;
  address?: string;
  birthDate?: string;
  gender?: string;
  specialty?: string;
  licenseNumber?: string;
  service?: string;
  keycloakId?: string;
};

@Injectable({ providedIn: 'root' })
export class UserRegistryService {
  private readonly base = '/users';

  constructor(private http: HttpClient) {}

  list(): Observable<RegistryUserDto[]> {
    return this.http.get<RegistryUserDto[]>(this.base);
  }

  search(q: string): Observable<RegistryUserDto[]> {
    const params = new HttpParams().set('q', q);
    return this.http.get<RegistryUserDto[]>(`${this.base}/search`, { params });
  }

  byRole(role: 'patient' | 'medecin'): Observable<RegistryUserDto[]> {
    return this.http.get<RegistryUserDto[]>(`${this.base}/role/${role}`);
  }

  getOne(id: number): Observable<RegistryUserDto> {
    return this.http.get<RegistryUserDto>(`${this.base}/${id}`);
  }

  create(body: RegistryUserCreatePayload): Observable<RegistryUserDto> {
    return this.http.post<RegistryUserDto>(this.base, body);
  }

  update(id: number, body: Partial<RegistryUserCreatePayload> & Record<string, unknown>): Observable<RegistryUserDto> {
    return this.http.put<RegistryUserDto>(`${this.base}/${id}`, body);
  }

  deactivate(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }
}
