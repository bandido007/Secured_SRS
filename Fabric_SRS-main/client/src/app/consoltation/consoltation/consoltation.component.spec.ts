import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsoltationComponent } from './consoltation.component';

describe('ConsoltationComponent', () => {
  let component: ConsoltationComponent;
  let fixture: ComponentFixture<ConsoltationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConsoltationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsoltationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
