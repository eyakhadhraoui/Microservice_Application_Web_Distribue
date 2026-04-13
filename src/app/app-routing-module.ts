import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout-component/layout-component';
import { Home } from './home/home';
import { Back } from './back/back';
import { ConsultationHistory } from './consultation-history/consultation-history';
import { Users } from './users/users';
import { TreatmentComponent } from './treatment/treatment';
import { DossiersListComponent } from './dossiers-list-component/dossiers-list-component';
import { CalendrierPatientComponent } from './calendrier-patient/calendrier-patient';
import { Navbar } from './navbar/navbar';
import { Login } from './login/login';
import { Register } from './register/register';
import { patientAreaGuard, medecinAreaGuard, requireAuthGuard } from './auth/auth.guard';
import { AfficheConsultationComponent } from './affiche-consultation/affiche-consultation';
import { ConsultationComponent } from './consultation/consultation';
import { AjouterRendezvousComponent } from './ajouter-rendezvous/ajouter-rendezvous';
import { AjouterRapportComponent } from './ajouter-rapport/ajouter-rapport';
import { UpdateConsultationComponent } from './update-consultation/update-consultation';
import { UpdateRendezvousComponent } from './update-rendezvous/update-rendezvous';
import { UpdateRapportComponent } from './update-rapport/update-rapport';
import { ConsultationDetailComponent } from './consultation-detail/consultation-detail';
import { RemindersComponent } from './reminders/reminders';
import { ReminderMedicaHomeComponent } from './reminder-medica-home/reminder-medica-home';
import { NutritionPatientComponent } from './nutrition-patient/nutrition-patient';
import { MedicationScannerComponent } from './medication-scanner/medication-scanner.component';

import { InfectionVaccination } from './infection-vaccination/infection-vaccination';


const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },

  {
    path: '',
    canActivate: [requireAuthGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },

  // Front office — patient
  {
    path: 'home',
    component: Navbar,
    canActivate: [patientAreaGuard],
    children: [
      { path: '', component: Home },
      { path: 'treatment', component: TreatmentComponent },
      { path: 'history', component: ConsultationHistory },
      { path: 'calendrier', component: CalendrierPatientComponent },
      { path: 'reminders', component: ReminderMedicaHomeComponent },
      { path: 'reminder-classic', component: RemindersComponent },
      { path: 'nutrition', component: NutritionPatientComponent },
      { path: 'scanner', component: MedicationScannerComponent },
    ],
  },
  




  // Back office — médecin
  {
    path: 'back',
    component: LayoutComponent,
    canActivate: [medecinAreaGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dossiers', component: DossiersListComponent },
      { path: 'dashboard', component: Back },
      { path: 'users', component: Users },
      /** Interface dédiée : table `user` (PostgreSQL nephro_users) via Symfony /api/users */
      { path: 'utilisateurs-postgres', component: Users, data: { postgresDbOnly: true } },
      { path: 'consultations', component: AfficheConsultationComponent },
      { path: 'consultations/new', component: ConsultationComponent },
      { path: 'rendezvous/new', component: AjouterRendezvousComponent },
      { path: 'rapports/new', component: AjouterRapportComponent },
      { path: 'consultations/edit/:id', component: UpdateConsultationComponent },
      { path: 'rendezvous/edit/:id', component: UpdateRendezvousComponent },
      { path: 'rapports/edit/:id', component: UpdateRapportComponent },
      { path: 'consultation-detail', component: ConsultationDetailComponent },
      { path: 'treatment', component: TreatmentComponent},
      { path: 'reminder', component: RemindersComponent},
    
      { path: 'infections', component: InfectionVaccination },
  
    ],
  },

    ],
  },

  { path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }