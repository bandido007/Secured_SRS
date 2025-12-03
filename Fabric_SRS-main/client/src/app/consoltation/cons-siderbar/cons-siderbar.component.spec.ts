import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsSiderbarComponent } from './cons-siderbar.component';

describe('ConsSiderbarComponent', () => {
  let component: ConsSiderbarComponent;
  let fixture: ComponentFixture<ConsSiderbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConsSiderbarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsSiderbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
