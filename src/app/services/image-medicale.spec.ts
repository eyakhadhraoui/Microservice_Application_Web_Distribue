import { TestBed } from '@angular/core/testing';

import { ImageMedicale } from './image-medicale';

describe('ImageMedicale', () => {
  let service: ImageMedicale;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageMedicale);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
