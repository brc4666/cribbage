import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TotalscoreComponent } from './totalscore.component';

describe('TotalscoreComponent', () => {
  let component: TotalscoreComponent;
  let fixture: ComponentFixture<TotalscoreComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TotalscoreComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TotalscoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
