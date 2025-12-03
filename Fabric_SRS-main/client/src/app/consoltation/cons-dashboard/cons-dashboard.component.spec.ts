import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsDashboardComponent } from './cons-dashboard.component';

describe('ConsDashboardComponent', () => {
  let component: ConsDashboardComponent;
  let fixture: ComponentFixture<ConsDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConsDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
