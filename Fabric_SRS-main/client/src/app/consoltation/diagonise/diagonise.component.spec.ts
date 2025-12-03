import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiagoniseComponent } from './diagonise.component';

describe('DiagoniseComponent', () => {
  let component: DiagoniseComponent;
  let fixture: ComponentFixture<DiagoniseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DiagoniseComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DiagoniseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
