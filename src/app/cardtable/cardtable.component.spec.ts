import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardtableComponent } from './cardtable.component';

describe('CardtableComponent', () => {
  let component: CardtableComponent;
  let fixture: ComponentFixture<CardtableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CardtableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardtableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
