import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PharmacySidenavComponent } from './pharmacy-sidenav.component';

describe('PharmacySidenavComponent', () => {
  let component: PharmacySidenavComponent;
  let fixture: ComponentFixture<PharmacySidenavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PharmacySidenavComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PharmacySidenavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
