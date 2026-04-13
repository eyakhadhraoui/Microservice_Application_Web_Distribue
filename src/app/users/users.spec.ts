import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { Users } from './users';
import { ConfirmService } from '../services/confirm.service';
import { ConsultationService } from '../services/consultation.service';
import { PatientService } from '../services/patient.service';
import { DossierService } from '../services/dossier';

describe('Users', () => {
  let component: Users;
  let fixture: ComponentFixture<Users>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule],
      declarations: [Users],
      providers: [
        { provide: ConfirmService, useValue: { confirm: () => Promise.resolve(false) } },
        { provide: ConsultationService, useValue: { getPatients: () => of([]) } },
        { provide: PatientService, useValue: { getAll: () => of([]) } },
        { provide: DossierService, useValue: { getAllDossiers: () => of([]) } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Users);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
