import { Component, OnInit } from '@angular/core';
import { Chart } from 'angular-highcharts';
import { FabricService } from 'src/app/services/fabric.service';
import { barChart } from '../../charts/barChart'

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  patients: any[] = []
  orgs: any
  treated: any
  active: any

  male = 0
  female = 0

  constructor(
    private service: FabricService
  ) { }
  barChart: any


  ngOnInit(): void {
    this.service.getDashData().subscribe((result: any) => {
      console.log(result);
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
