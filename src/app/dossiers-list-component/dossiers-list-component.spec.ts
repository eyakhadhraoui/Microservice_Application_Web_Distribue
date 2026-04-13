import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DossiersListComponent } from './dossiers-list-component';

describe('DossiersListComponent', () => {
  let component: DossiersListComponent;
  let fixture: ComponentFixture<DossiersListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DossiersListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DossiersListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
