import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RescribeComponent } from './rescribe.component';

describe('RescribeComponent', () => {
  let component: RescribeComponent;
  let fixture: ComponentFixture<RescribeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RescribeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RescribeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
