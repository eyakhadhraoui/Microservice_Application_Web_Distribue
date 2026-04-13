import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NutritionHome } from './nutrition-home';

describe('NutritionHome', () => {
  let component: NutritionHome;
  let fixture: ComponentFixture<NutritionHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NutritionHome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NutritionHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
