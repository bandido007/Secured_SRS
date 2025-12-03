import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Chart } from 'angular-highcharts';
import { FabricService } from 'src/app/services/fabric.service';
import { RegisterUserComponent } from '../register-user/register-user.component';

@Component({
  selector: 'app-admin-dashboardd',
  templateUrl: './admin-dashboardd.component.html',
  styleUrls: ['./admin-dashboardd.component.css']
})
export class AdminDashboarddComponent implements OnInit {
  patients: any[] = []
  orgs: any
  treated: any
  active: any

  male = 0
  female = 0

  users: any[] = []

  constructor(
    private service: FabricService,
    private dialog: MatDialog
  ) { }
  barChart: any

  registerUser() {
    this.dialog.open(RegisterUserComponent)
  }

  ngOnInit(): void {

    this.service.getUsers().subscribe((result: any) => {
      console.log(result);
      this.users = result.data.users
    })

    this.service.getDashData().subscribe((result: any) => {
      this.patients = result.data.patients
      this.orgs = result.data.orgs
      this.active = result.data.active
      this.treated = result.data.treated

      result.data.patients.forEach((pt: any) => {
        if (pt.gender == 'Male') this.male++
        else this.female++
      });
      
      this.barChart = new Chart(
        {
          chart: {
            type: 'bar',
          },
          credits: {
            enabled: false,
          },
          title: {
            text: 'Total patients',
          },
          yAxis: {
            visible: false,
            gridLineColor: '#fff',
          },
          legend: {
            enabled: false,
          },
          xAxis: {
            lineColor: '#fff',
            categories: [
              'Male',
              'Female',
            ],
          },
        
          plotOptions: {
            series: {
              borderRadius: 5,
            } as any,
          },
        
          series: [
            {
              type: 'bar',
              color: '#506ef9',
              data: [
                { y: this.male },
                { y: this.female }
              ],
            },
          ],
        }
      );
      
    })
  }
}
