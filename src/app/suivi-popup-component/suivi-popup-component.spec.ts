import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuiviPopupComponent } from './suivi-popup-component';

describe('SuiviPopupComponent', () => {
  let component: SuiviPopupComponent;
  let fixture: ComponentFixture<SuiviPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SuiviPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuiviPopupComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
