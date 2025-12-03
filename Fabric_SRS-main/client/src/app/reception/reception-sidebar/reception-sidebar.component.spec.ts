import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceptionSidebarComponent } from './reception-sidebar.component';

describe('ReceptionSidebarComponent', () => {
  let component: ReceptionSidebarComponent;
  let fixture: ComponentFixture<ReceptionSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReceptionSidebarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceptionSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
