import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CutdeckComponent } from './cutdeck.component';

describe('CutdeckComponent', () => {
  let component: CutdeckComponent;
  let fixture: ComponentFixture<CutdeckComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CutdeckComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CutdeckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
