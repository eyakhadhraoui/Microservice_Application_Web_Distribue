import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfectionDashboardComponent } from './infection-dashboard';

describe('InfectionDashboard', () => {
  let component: InfectionDashboardComponent;
  let fixture: ComponentFixture<InfectionDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfectionDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfectionDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
