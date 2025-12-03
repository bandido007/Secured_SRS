import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewpatientComponent } from './newpatient.component';

describe('NewpatientComponent', () => {
  let component: NewpatientComponent;
  let fixture: ComponentFixture<NewpatientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewpatientComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewpatientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
