import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-back-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './back-layout.html',
  styleUrls: ['./back-layout.css']
})
export class BackLayoutComponent implements OnInit {

  doctor = { name: '', role: 'Néphrologue', initials: 'DR' };

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    const username = this.auth.getProfile()?.username ?? '';
    this.doctor.name = username ? `Dr. ${username}` : 'Dr. Doctor';
    this.doctor.initials = username ? username.substring(0, 2).toUpperCase() : 'DR';
  }

  logout(): void {
    this.auth.logout();
  }
}
