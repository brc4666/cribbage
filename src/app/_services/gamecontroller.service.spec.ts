import { TestBed } from '@angular/core/testing';

import { GameControllerService } from './gamecontroller.service';

describe('GameControllerService', () => {
  let service: GameControllerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameControllerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
