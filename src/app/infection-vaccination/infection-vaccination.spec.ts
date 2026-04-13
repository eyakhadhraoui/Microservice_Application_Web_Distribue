import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { InfectionVaccination } from './infection-vaccination';

describe('InfectionVaccination', () => {
  let component: InfectionVaccination;
  let fixture: ComponentFixture<InfectionVaccination>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfectionVaccination, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(InfectionVaccination);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
