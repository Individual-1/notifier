import { TestBed } from '@angular/core/testing';

import { PageRouterGuard } from './page-router.guard';

describe('PageRouterGuard', () => {
  let guard: PageRouterGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(PageRouterGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
