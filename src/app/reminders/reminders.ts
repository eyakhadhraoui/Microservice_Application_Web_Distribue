import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-reminders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="reminders-page">
      <h1>⏰ Medication reminders</h1>
      <p class="subtitle">Manage your medication schedules and alerts</p>
      <div class="reminders-placeholder">
        <p>No reminders configured. Your prescribed medications can be linked to reminders from the Treatments page.</p>
        <a routerLink="/home/treatment" class="btn-link">Go to My Medications</a>
      </div>
    </div>
  `,
  styles: [`
    .reminders-page { padding: 24px; max-width: 600px; }
    .reminders-page h1 { margin: 0 0 8px; font-size: 24px; color: #1e293b; }
    .subtitle { color: #64748b; margin: 0 0 24px; }
    .reminders-placeholder { background: #f8fafc; border-radius: 12px; padding: 24px; border: 1px dashed #cbd5e1; }
    .btn-link { display: inline-block; margin-top: 16px; color: #2563eb; font-weight: 600; }
  `],
})
export class RemindersComponent {}
