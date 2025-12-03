import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GivedrugsComponent } from './givedrugs.component';

describe('GivedrugsComponent', () => {
  let component: GivedrugsComponent;
  let fixture: ComponentFixture<GivedrugsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GivedrugsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GivedrugsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
