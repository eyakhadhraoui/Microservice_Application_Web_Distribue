import { Component, OnInit } from '@angular/core';
import { DashboardNotificationService } from '../services/dashboard-notification.service';

@Component({
  selector: 'app-layout-component',
  standalone: false,
  templateUrl: './layout-component.html',
  styleUrl: './layout-component.css',
})
export class LayoutComponent implements OnInit {
  constructor(private dashboardNotification: DashboardNotificationService) {}

  ngOnInit(): void {
    this.dashboardNotification.load();
  }
}
