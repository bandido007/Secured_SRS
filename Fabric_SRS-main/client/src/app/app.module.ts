import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthComponent } from './auth/auth/auth.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import {MatFormFieldModule} from '@angular/material/form-field';
import {MatDialogModule} from '@angular/material/dialog';
import {MatCardModule} from '@angular/material/card';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import { ReceptionComponent } from './reception/reception/reception.component';
import { ReceptionDashboardComponent } from './reception/reception-dashboard/reception-dashboard.component';
import {MatSidenavModule} from '@angular/material/sidenav';
import { ReceptionNavbarComponent } from './reception/reception-navbar/reception-navbar.component';
import {MatToolbarModule} from '@angular/material/toolbar';
import { ReceptionSidebarComponent } from './reception/reception-sidebar/reception-sidebar.component';
import {MatListModule} from '@angular/material/list';
import { NewpatientComponent } from './reception/newpatient/newpatient.component';
import { SearchpatientComponent } from './reception/searchpatient/searchpatient.component';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatSelectModule} from '@angular/material/select';
import {MatRadioModule} from '@angular/material/radio';
import { DataTablesModule } from "angular-datatables";
import { FormsModule } from '@angular/forms';
import { ConsoltationComponent } from './consoltation/consoltation/consoltation.component';
import { ConsDashboardComponent } from './consoltation/cons-dashboard/cons-dashboard.component';
import { ConsSearchpatientComponent } from './consoltation/cons-searchpatient/cons-searchpatient.component';
import { ConsSiderbarComponent } from './consoltation/cons-siderbar/cons-siderbar.component';
import { ConsExamformComponent } from './consoltation/cons-examform/cons-examform.component';
import { ConsHistoryformComponent } from './consoltation/cons-historyform/cons-historyform.component';
import { LaboratoryComponent } from './laboratory/laboratory/laboratory.component';
import { LabDashboardComponent } from './laboratory/lab-dashboard/lab-dashboard.component';
import { LabSidenavComponent } from './laboratory/lab-sidenav/lab-sidenav.component';
import { LabTestsComponent } from './laboratory/lab-tests/lab-tests.component';
import { FabricService } from './services/fabric.service';
import { HttpClientModule } from '@angular/common/http';
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { FlexLayoutModule } from '@angular/flex-layout';
import { PaymentmodalComponent } from './reception/paymentmodal/paymentmodal.component'
import {MatNativeDateModule} from '@angular/material/core';
import { DiagoniseComponent } from './consoltation/diagonise/diagonise.component';
import { RescribeComponent } from './consoltation/rescribe/rescribe.component';
import { PrescribeComponent } from './consoltation/prescribe/prescribe.component';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { PatientTestComponent } from './laboratory/patient-test/patient-test.component';
import { LabTestComponent } from './laboratory/lab-test/lab-test.component';
import { ViewResultImageComponent } from './consoltation/view-result-image/view-result-image.component';

import { ChartModule } from 'angular-highcharts';
import { DashboardComponent } from './charts/dashboard/dashboard.component'
import { AdddrugsComponent } from './pharmacy/adddrugs/adddrugs.component';
import { GivedrugsComponent } from './pharmacy/givedrugs/givedrugs.component';
import { PharmacyComponent } from './pharmacy/pharmacy/pharmacy.component';
import { PharmacySidenavComponent } from './pharmacy/pharmacy-sidenav/pharmacy-sidenav.component';
import { PharmacydashboardComponent } from './pharmacy/pharmacydashboard/pharmacydashboard.component';
import { ReceiptsComponent } from './pharmacy/receipts/receipts.component';
import { AccountComponent } from './accounts/account/account.component';
import { AccountDashboardComponent } from './accounts/account-dashboard/account-dashboard.component';
import { AccountProcesspaymentComponent } from './accounts/account-processpayment/account-processpayment.component';
import { AccountQueComponent } from './accounts/account-que/account-que.component';
import { AccountReceiptComponent } from './accounts/account-receipt/account-receipt.component';
import { AccountSidebarComponent } from './accounts/account-sidebar/account-sidebar.component';
import {MatExpansionModule} from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { AdminComponent } from './admin/admin/admin.component';
import { RegisterUsersComponent } from './admin/register-users/register-users.component';
import { AdminDashboarddComponent } from './admin/admin-dashboardd/admin-dashboardd.component';
import { AdminUsersComponent } from './admin/admin-users/admin-users.component';
import { RegisterUserComponent } from './admin/register-user/register-user.component'

@NgModule({
  declarations: [
    AppComponent,
    AuthComponent,
    ReceptionComponent,
    ReceptionDashboardComponent,
    ReceptionNavbarComponent,
    ReceptionSidebarComponent,
    NewpatientComponent,
    SearchpatientComponent,
    ConsoltationComponent,
    ConsDashboardComponent,
    ConsSearchpatientComponent,
    ConsSiderbarComponent,
    ConsExamformComponent,
    ConsHistoryformComponent,
    LaboratoryComponent,
    LabDashboardComponent,
    LabSidenavComponent,
    LabTestsComponent,
    PaymentmodalComponent,
    DiagoniseComponent,
    RescribeComponent,
    PrescribeComponent,
    PatientTestComponent,
    LabTestComponent,
    ViewResultImageComponent,
    DashboardComponent,
    ViewResultImageComponent,
    AdddrugsComponent,
    GivedrugsComponent,
    PharmacyComponent,
    PharmacySidenavComponent,
    PharmacydashboardComponent,
    ReceiptsComponent,
    AccountComponent,
    AccountDashboardComponent,
    AccountProcesspaymentComponent,
    AccountQueComponent,
    AccountReceiptComponent,
    AccountSidebarComponent,
    AdminComponent,
    RegisterUsersComponent,
    AdminDashboarddComponent,
    AdminUsersComponent,
    RegisterUserComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatFormFieldModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatDatepickerModule,
    MatSnackBarModule,
    MatSelectModule,
    MatRadioModule,
    DataTablesModule,
    FormsModule,
    HttpClientModule,
    MatNativeDateModule,
    FlexLayoutModule,
    MatDialogModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    ChartModule,
    MatChipsModule,
    MatExpansionModule
  ],
  providers: [FabricService],
  bootstrap: [AppComponent]
})
export class AppModule { }
