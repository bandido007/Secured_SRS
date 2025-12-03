import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewResultImageComponent } from './view-result-image.component';

describe('ViewResultImageComponent', () => {
  let component: ViewResultImageComponent;
  let fixture: ComponentFixture<ViewResultImageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewResultImageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewResultImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
