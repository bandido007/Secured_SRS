import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDashboarddComponent } from './admin-dashboardd.component';

describe('AdminDashboarddComponent', () => {
  let component: AdminDashboarddComponent;
  let fixture: ComponentFixture<AdminDashboarddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminDashboarddComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminDashboarddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
