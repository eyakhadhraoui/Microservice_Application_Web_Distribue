import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface NotificationItem {
  icon: string;
  title: string;
  time: string;
  type?: string;
  idDossierMedical?: number;
  idItem?: number;
}

interface NotificationPayload {
  type?: string;
  titre?: string;
  date?: string;
  idDossierMedical?: number;
  idItem?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationWebSocketService {
  private apiUrl = '/api/patients/me';
  private client: Client | null = null;
  private connected = false;

  private notificationsSubject = new BehaviorSubject<NotificationItem[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  readonly notifications$ = this.notificationsSubject.asObservable();
  readonly unreadCount$ = this.unreadCountSubject.asObservable();

  /** Callback pour afficher un toast (injecté par le composant). */
  onToast: ((msg: string) => void) | null = null;

  constructor(private http: HttpClient) {}

  /**
   * URL SockJS au moment de la connexion.
   * Si l’app est ouverte sur http://localhost:8089 (ancien réflexe « API NEPHRO »), SockJS ne doit pas
   * rester sur 8089 : rien n’écoute /ws côté navigateur — on repasse sur le port 80 (nginx Docker) ou 4200 (ng serve).
   */
  private sockJsServerUrl(): string {
    if (typeof window === 'undefined' || !window.location) {
      return '/ws';
    }
    const l = window.location;
    const h = l.hostname;
    const p = l.port;
    const isLocal = h === 'localhost' || h === '127.0.0.1';
    // Ancien bug : front sur :8089 → origin ...:8089/ws → ERR_CONNECTION_REFUSED
    if (isLocal && p === '8089') {
      return `${l.protocol}//${h}:8095/ws`;
    }
    return `${l.origin}/ws`;
  }

  /** Démarre la connexion WebSocket pour le patient connecté (idPatient). */
  connectForPatient(): void {
    this.http.get<Record<string, unknown>>(this.apiUrl).subscribe({
      next: (me) => {
        const raw = me?.['idPatient'] ?? me?.['id'] ?? me?.['patientId'];
        const id = raw != null ? Number(raw) : NaN;
        if (!isNaN(id) && id > 0) {
          this.connect(id);
        }
      },
      error: () => {}
    });
  }

  private connect(idPatient: number): void {
    if (this.client?.active) return;

    try {
      const socket = new SockJS(this.sockJsServerUrl());
      this.client = new Client({
        webSocketFactory: () => socket as unknown as WebSocket,
        debug: () => {},
        onConnect: () => {
          this.connected = true;
          this.client?.subscribe('/topic/patient/' + idPatient, (message) => {
            try {
              const body: NotificationPayload = JSON.parse(message.body);
              this.handleNotification(body);
            } catch { /* ignore */ }
          });
        },
        onStompError: () => {
          this.connected = false;
        },
        onWebSocketClose: () => {
          this.connected = false;
        }
      });
      this.client.activate();
    } catch (e) {
      // Si SockJS/STOMP échoue (ex. global undefined), ne pas faire planter l'app
    }
  }

  private handleNotification(payload: NotificationPayload): void {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const icon = payload.type === 'IMAGE_MEDICALE' ? '🖼️' : '📋';
    const title = payload.titre || 'Nouvelle notification';
    const item: NotificationItem = {
      icon,
      title,
      time: timeStr,
      type: payload.type,
      idDossierMedical: payload.idDossierMedical,
      idItem: payload.idItem
    };
    const list = [...this.notificationsSubject.value, item];
    this.notificationsSubject.next(list);
    this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
    if (this.onToast) this.onToast(title);
  }

  /** Marquer les notifications comme lues (remet le compteur à 0). */
  markAllAsRead(): void {
    this.unreadCountSubject.next(0);
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.connected = false;
  }
}
