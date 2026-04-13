import { Component, OnInit } from '@angular/core';
import { CalendrierService, CalendrierEvent, TypeEventCalendrier } from '../services/calendrier.service';

export type FilterType = 'all' | TypeEventCalendrier;

@Component({
  selector: 'app-calendrier-patient',
  standalone: false,
  templateUrl: './calendrier-patient.html',
  styleUrl: './calendrier-patient.css'
})
export class CalendrierPatientComponent implements OnInit {
  events: CalendrierEvent[] = [];
  loading = true;
  error = '';

  /** Filtre par type : tous, suivi uniquement, image uniquement */
  filterType: FilterType = 'all';

  /** Mois/année affichés */
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth();

  /** Événements regroupés par date (clé = YYYY-MM-DD) */
  eventsByDate: Record<string, CalendrierEvent[]> = {};

  constructor(private calendrierService: CalendrierService) {}

  setFilter(type: FilterType): void {
    this.filterType = type;
  }

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading = true;
    this.error = '';
    this.calendrierService.getMesEvenements().subscribe({
      next: (list) => {
        this.events = list;
        this.groupEventsByDate();
        this.loading = false;
      },
      error: (err) => {
        const body = err?.error;
        const serverMsg = body && typeof body === 'object' && body.message ? body.message : null;
        this.error = serverMsg || err?.message || 'Unable to load calendar.';
        this.loading = false;
      }
    });
  }

  private groupEventsByDate(): void {
    const byDate: Record<string, CalendrierEvent[]> = {};
    for (const e of this.events) {
      const d = e.date && e.date.length >= 10 ? e.date.substring(0, 10) : e.date;
      if (!d) continue;
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(e);
    }
    this.eventsByDate = byDate;
  }

  /** Jours du mois courant avec événements (pour la vue liste). */
  get datesWithEvents(): string[] {
    const keys = Object.keys(this.eventsByDate).filter(d => {
      const [y, m] = d.split('-').map(Number);
      return y === this.currentYear && m === this.currentMonth + 1;
    });
    keys.sort();
    return keys;
  }

  /** Tous les jours avec événements (après filtre), du plus récent au plus ancien. */
  get allDatesWithEvents(): string[] {
    const keys = Object.keys(this.eventsByDate).filter(dateKey => {
      const list = this.eventsByDate[dateKey] || [];
      const filtered = this.filterType === 'all' ? list : list.filter(e => e.type === this.filterType);
      return filtered.length > 0;
    });
    keys.sort((a, b) => b.localeCompare(a));
    return keys;
  }

  /** Événements d'une date (après filtre), triés : images puis suivis. */
  getEventsForDate(dateKey: string): CalendrierEvent[] {
    let list = this.eventsByDate[dateKey] || [];
    if (this.filterType !== 'all') list = list.filter(e => e.type === this.filterType);
    return [...list].sort((a, b) => {
      if (a.type !== b.type) return a.type === 'IMAGE_MEDICALE' ? -1 : 1;
      return 0;
    });
  }

  /** Nombre d'événements pour une date (après filtre). */
  getEventCountForDate(dateKey: string): number {
    return this.getEventsForDate(dateKey).length;
  }

  /** Statistiques : total et par type. */
  get totalEvents(): number { return this.events.length; }
  get countSuivis(): number { return this.events.filter(e => e.type === 'SUIVI').length; }
  get countImages(): number { return this.events.filter(e => e.type === 'IMAGE_MEDICALE').length; }

  /** Date du jour au format YYYY-MM-DD. */
  get todayKey(): string {
    const t = new Date();
    return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
  }

  isToday(dateKey: string): boolean {
    return dateKey === this.todayKey;
  }

  /** Revenir au mois courant. */
  goToToday(): void {
    const t = new Date();
    this.currentYear = t.getFullYear();
    this.currentMonth = t.getMonth();
  }

  /** Jours du mois pour la mini-grille (1-28/29/30/31). */
  get daysInCurrentMonth(): number {
    return new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
  }

  /** Premier jour du mois (0 = dimanche, 1 = lundi, ...). */
  get firstDayOfMonth(): number {
    return new Date(this.currentYear, this.currentMonth, 1).getDay();
  }

  /** Indique si une date (jour du mois) a des événements. */
  hasEventsOnDay(day: number): boolean {
    const dateKey = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return (this.eventsByDate[dateKey]?.length ?? 0) > 0;
  }

  /** Scroll vers la section d'une date (pour la grille). */
  scrollToDate(dateKey: string): void {
    const el = document.getElementById('day-' + dateKey);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  formatDateLabel(dateKey: string): string {
    if (!dateKey || dateKey.length < 10) return dateKey;
    const d = new Date(dateKey + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  getTypeLabel(type: string): string {
    return type === 'IMAGE_MEDICALE' ? 'Medical image' : 'Follow-up';
  }

  getTypeIcon(type: string): string {
    return type === 'IMAGE_MEDICALE' ? '🖼️' : '📋';
  }

  prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
  }

  get monthLabel(): string {
    const d = new Date(this.currentYear, this.currentMonth, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  /** Format court pour la grille (ex. "15"). */
  formatDayNum(dateKey: string): string {
    if (!dateKey || dateKey.length < 10) return '';
    return dateKey.substring(8, 10).replace(/^0/, '') || dateKey.slice(-2);
  }

  /** Grille du mois : cases pour chaque jour (avec décalage du 1er jour). */
  get monthGrid(): { day: number; dateKey: string; hasEvents: boolean }[] {
    const n = this.daysInCurrentMonth;
    const first = this.firstDayOfMonth;
    const list: { day: number; dateKey: string; hasEvents: boolean }[] = [];
    const y = this.currentYear;
    const m = String(this.currentMonth + 1).padStart(2, '0');
    for (let i = 0; i < first; i++) list.push({ day: 0, dateKey: '', hasEvents: false });
    for (let day = 1; day <= n; day++) {
      const d = String(day).padStart(2, '0');
      const dateKey = `${y}-${m}-${d}`;
      list.push({ day, dateKey, hasEvents: this.hasEventsOnDay(day) });
    }
    return list;
  }
}
