import { TestBed } from '@angular/core/testing';

import { Suivi } from './suivi';

describe('Suivi', () => {
  let service: Suivi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Suivi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
