import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabSidenavComponent } from './lab-sidenav.component';

describe('LabSidenavComponent', () => {
  let component: LabSidenavComponent;
  let fixture: ComponentFixture<LabSidenavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LabSidenavComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LabSidenavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
