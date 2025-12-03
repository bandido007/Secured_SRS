import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsSearchpatientComponent } from './cons-searchpatient.component';

describe('ConsSearchpatientComponent', () => {
  let component: ConsSearchpatientComponent;
  let fixture: ComponentFixture<ConsSearchpatientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConsSearchpatientComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsSearchpatientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
