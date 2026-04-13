import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, NotificationMessage } from '../services/notification.service';
import { ConfirmService, ConfirmPayload } from '../services/confirm.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-messages.html',
  styleUrl: './app-messages.css',
})
export class AppMessagesComponent implements OnInit, OnDestroy {
  notification: NotificationMessage | null = null;
  confirmDialog: ConfirmPayload | null = null;
  private subNotification?: Subscription;
  private subConfirm?: Subscription;

  constructor(
    private notificationService: NotificationService,
    private confirmService: ConfirmService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.subNotification = this.notificationService.message$.subscribe((m) => {
      setTimeout(() => {
        this.notification = m;
        this.cdr.detectChanges();
      }, 0);
    });
    this.subConfirm = this.confirmService.open$.subscribe((d) => {
      setTimeout(() => {
        this.confirmDialog = d;
        this.cdr.detectChanges();
      }, 0);
    });
  }

  ngOnDestroy(): void {
    this.subNotification?.unsubscribe();
    this.subConfirm?.unsubscribe();
  }

  closeNotification(): void {
    this.notificationService.clear();
  }

  onConfirm(ok: boolean): void {
    if (this.confirmDialog) {
      this.confirmDialog.resolve(ok);
      this.confirmDialog = null;
    }
  }
}
