import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscardpileComponent } from './discardpile.component';

describe('DiscardpileComponent', () => {
  let component: DiscardpileComponent;
  let fixture: ComponentFixture<DiscardpileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DiscardpileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiscardpileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
