import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './auth/auth/auth.component';
import { ConsDashboardComponent } from './consoltation/cons-dashboard/cons-dashboard.component';
import { ConsExamformComponent } from './consoltation/cons-examform/cons-examform.component';
import { ConsHistoryformComponent } from './consoltation/cons-historyform/cons-historyform.component';
import { ConsSearchpatientComponent } from './consoltation/cons-searchpatient/cons-searchpatient.component';
import { ConsoltationComponent } from './consoltation/consoltation/consoltation.component';
import { DiagoniseComponent } from './consoltation/diagonise/diagonise.component';
import { PrescribeComponent } from './consoltation/prescribe/prescribe.component';
import { LabDashboardComponent } from './laboratory/lab-dashboard/lab-dashboard.component';
import { LabTestsComponent } from './laboratory/lab-tests/lab-tests.component';
import { LaboratoryComponent } from './laboratory/laboratory/laboratory.component';
import { NewpatientComponent } from './reception/newpatient/newpatient.component';
import { ReceptionDashboardComponent } from './reception/reception-dashboard/reception-dashboard.component';
import { ReceptionComponent } from './reception/reception/reception.component';
import { SearchpatientComponent } from './reception/searchpatient/searchpatient.component';
import { AccountComponent } from './accounts/account/account.component'
import { AccountDashboardComponent } from './accounts/account-dashboard/account-dashboard.component';
import { AccountProcesspaymentComponent } from './accounts/account-processpayment/account-processpayment.component';
import { AccountReceiptComponent } from './accounts/account-receipt/account-receipt.component';
import { PharmacydashboardComponent } from './pharmacy/pharmacydashboard/pharmacydashboard.component';
import { GivedrugsComponent } from './pharmacy/givedrugs/givedrugs.component';
import { AdddrugsComponent } from './pharmacy/adddrugs/adddrugs.component';
import { PharmacyComponent } from './pharmacy/pharmacy/pharmacy.component';
import { AdminComponent } from './admin/admin/admin.component';
import { AdminDashboarddComponent } from './admin/admin-dashboardd/admin-dashboardd.component';
import { RegisterUsersComponent } from './admin/register-users/register-users.component';
import { AdminUsersComponent } from './admin/admin-users/admin-users.component';


const routes: Routes = [

  //Reception links
  {
    path: "reception", component: ReceptionComponent, children:
      [
        { path: "dashboard", component: ReceptionDashboardComponent },
        { path: "addpatient", component: NewpatientComponent },
        { path: "findpatient", component: SearchpatientComponent },
      ],

  },

  //consultation links
  {
    path: "consult", component: ConsoltationComponent, children: [
      { path: "dashboard", component: ConsDashboardComponent },
      { path: "patients", component: ConsSearchpatientComponent },
      { path: "history", component: ConsHistoryformComponent },
      { path: "examine", component: ConsExamformComponent },
      { path: "diagonise", component: DiagoniseComponent },
      { path: "prescribe", component: PrescribeComponent },
    ]
  },
  //laboratory links

  {
    path: "lab", component: LaboratoryComponent, children: [
      { path: "dashboard", component: LabDashboardComponent },
      { path: "tests", component: LabTestsComponent },
    ]
  },

  //Account links
{path:"account",component:AccountComponent,children:[
  {path:"dashboard",component:AccountDashboardComponent},
  {path:"processpayment",component:AccountProcesspaymentComponent},
  {path:"receipt",component:AccountReceiptComponent},
]},

//Pharmacy links
{path:"pharmacy",component:PharmacyComponent,children:[
  {path:"dashboard",component:PharmacydashboardComponent},
  {path:"givedrugs",component:GivedrugsComponent},
  {path:"adddrugs",component:AdddrugsComponent},
 
]},

{
  path: 'admin',
  component: AdminComponent,
  children: [
    {
      path: 'dashboard',
      component: AdminDashboarddComponent
    },
    {
      path: 'registerUser',
      component: RegisterUsersComponent
    },
    {
      path: 'users',
      component: AdminUsersComponent
    }
  ]
},

  //auth link 
  { path: "**", component: AuthComponent },



];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
