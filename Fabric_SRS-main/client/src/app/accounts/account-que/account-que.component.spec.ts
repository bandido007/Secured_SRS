import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountQueComponent } from './account-que.component';

describe('AccountQueComponent', () => {
  let component: AccountQueComponent;
  let fixture: ComponentFixture<AccountQueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AccountQueComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountQueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
