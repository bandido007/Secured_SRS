import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceptionNavbarComponent } from './reception-navbar.component';

describe('ReceptionNavbarComponent', () => {
  let component: ReceptionNavbarComponent;
  let fixture: ComponentFixture<ReceptionNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReceptionNavbarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceptionNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
