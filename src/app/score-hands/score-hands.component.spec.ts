import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoreHandsComponent } from './score-hands.component';

describe('ScoreHandsComponent', () => {
  let component: ScoreHandsComponent;
  let fixture: ComponentFixture<ScoreHandsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ScoreHandsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScoreHandsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
