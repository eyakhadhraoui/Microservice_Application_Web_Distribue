import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Back } from './back';

describe('Back', () => {
  let component: Back;
  let fixture: ComponentFixture<Back>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Back]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Back);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
