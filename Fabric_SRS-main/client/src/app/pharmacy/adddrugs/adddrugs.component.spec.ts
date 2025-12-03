import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdddrugsComponent } from './adddrugs.component';

describe('AdddrugsComponent', () => {
  let component: AdddrugsComponent;
  let fixture: ComponentFixture<AdddrugsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdddrugsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdddrugsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
