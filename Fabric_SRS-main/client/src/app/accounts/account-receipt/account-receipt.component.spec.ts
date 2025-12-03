import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountReceiptComponent } from './account-receipt.component';

describe('AccountReceiptComponent', () => {
  let component: AccountReceiptComponent;
  let fixture: ComponentFixture<AccountReceiptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AccountReceiptComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountReceiptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
