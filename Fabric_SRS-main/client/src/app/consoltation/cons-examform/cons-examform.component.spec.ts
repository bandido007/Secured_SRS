import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsExamformComponent } from './cons-examform.component';

describe('ConsExamformComponent', () => {
  let component: ConsExamformComponent;
  let fixture: ComponentFixture<ConsExamformComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConsExamformComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsExamformComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
