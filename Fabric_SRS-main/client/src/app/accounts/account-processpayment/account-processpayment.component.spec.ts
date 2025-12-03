import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountProcesspaymentComponent } from './account-processpayment.component';

describe('AccountProcesspaymentComponent', () => {
  let component: AccountProcesspaymentComponent;
  let fixture: ComponentFixture<AccountProcesspaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AccountProcesspaymentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountProcesspaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
