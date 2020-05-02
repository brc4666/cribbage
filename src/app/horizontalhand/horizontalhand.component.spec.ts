import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HorizontalhandComponent } from './horizontalhand.component';

describe('HorizontalhandComponent', () => {
  let component: HorizontalhandComponent;
  let fixture: ComponentFixture<HorizontalhandComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HorizontalhandComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HorizontalhandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
