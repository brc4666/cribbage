import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TurnuppileComponent } from './turnuppile.component';

describe('TurnuppileComponent', () => {
  let component: TurnuppileComponent;
  let fixture: ComponentFixture<TurnuppileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TurnuppileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TurnuppileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
