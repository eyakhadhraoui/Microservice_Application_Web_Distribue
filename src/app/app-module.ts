import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing-module';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { App } from './app';
import { Home } from './home/home';
import { Back } from './back/back';
import { ConsultationHistory } from './consultation-history/consultation-history';
import { Users } from './users/users';
import { TreatmentComponent } from './treatment/treatment';
import { DossiersListComponent } from './dossiers-list-component/dossiers-list-component';
import { SuiviPopupComponent } from './suivi-popup-component/suivi-popup-component';
import { CalendrierPatientComponent } from './calendrier-patient/calendrier-patient';
import { Sidebar } from './sidebar/sidebar';
import { LayoutComponent } from './layout-component/layout-component';
import { Navbar2 } from './navbar2/navbar2';
import { HttpClientModule } from '@angular/common/http';
import { DossierService } from './services/dossier';
import { SuiviService } from './services/suivi';
import { Navbar } from './navbar/navbar';
import { Login } from './login/login';
import { Register } from './register/register';

import { AuthService } from './auth/auth.service';
import { initializeAuth } from './auth/app-init';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { AppMessagesComponent } from './app-messages/app-messages';
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
import { MedicationScannerService } from './services/medication-scanner.service';
import { MedicationsBackComponent } from './medications-back/medications-back';
import { MedicationService } from './services/medication';
import { NutritionService } from './services/nutrition';
@NgModule({
  declarations: [
    App,
    Home,
    Back,
    ConsultationHistory,
    Users,
    ReminderMedicaHomeComponent,
    DossiersListComponent,
    SuiviPopupComponent,
    CalendrierPatientComponent,
    Sidebar,
    LayoutComponent,
    Navbar2,
    Navbar,
    Login,
    Register,
    MedicationsBackComponent,
    TreatmentComponent,
    ConsultationComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule,
    AppMessagesComponent,
    AfficheConsultationComponent,
    AjouterRendezvousComponent,
    AjouterRapportComponent,
    UpdateConsultationComponent,
    UpdateRendezvousComponent,
    UpdateRapportComponent,
    ConsultationDetailComponent,
    RemindersComponent,
    NutritionPatientComponent,
    MedicationScannerComponent,
  ],
  providers: [
    DossierService,
    SuiviService,
    MedicationService,
    NutritionService,
    MedicationScannerService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthService],
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
  bootstrap: [App],
})
export class AppModule {}