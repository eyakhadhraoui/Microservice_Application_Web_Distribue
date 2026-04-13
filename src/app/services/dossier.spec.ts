import { TestBed } from '@angular/core/testing';

import { Dossier } from './dossier';

describe('Dossier', () => {
  let service: Dossier;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Dossier);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
