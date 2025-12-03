import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsHistoryformComponent } from './cons-historyform.component';

describe('ConsHistoryformComponent', () => {
  let component: ConsHistoryformComponent;
  let fixture: ComponentFixture<ConsHistoryformComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConsHistoryformComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsHistoryformComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
