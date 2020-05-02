import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VerticalhandComponent } from './verticalhand.component';

describe('VerticalhandComponent', () => {
  let component: VerticalhandComponent;
  let fixture: ComponentFixture<VerticalhandComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VerticalhandComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VerticalhandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
