import { Component, OnInit } from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { calAge } from 'src/app/configs/config';
import { dataResponse, patient, patientFull } from 'src/app/interfaces/interfaces';
import { FabricService } from 'src/app/services/fabric.service';
import { ConsExamformComponent } from '../cons-examform/cons-examform.component';
import { DiagoniseComponent } from '../diagonise/diagonise.component';
import { PrescribeComponent } from '../prescribe/prescribe.component';

@Component({
  selector: 'app-cons-searchpatient',
  templateUrl: './cons-searchpatient.component.html',
  styleUrls: ['./cons-searchpatient.component.css']
})
export class ConsSearchpatientComponent implements OnInit {


  constructor(public dialog: MatDialog,
    private router: Router,
    private service: FabricService) {}
    showProgressBar=false
    showDataTable=false
    patients: patient[] = []

  openDiagonise(patient: any) {
    const dialogRef = this.dialog.open(DiagoniseComponent, { data: patient});
    dialogRef.afterClosed().subscribe(result => {
      this.fetchPatients()
    });
  }

  openExamine(patient_id: any){
    const dialogRef = this.dialog.open(ConsExamformComponent, { data: patient_id});
    dialogRef.afterClosed().subscribe(result => {
      this.fetchPatients()
    });

  }


  openPrescribe(patient_id: any){

    const dialogRef = this.dialog.open(PrescribeComponent, {data: patient_id});
    dialogRef.afterClosed().subscribe(result => {
      this.fetchPatients()
    });
    
  }


  ngOnInit(): void {

    this.fetchPatients()
    
  }

  viewHistory(patient_id: any) {
    this.router.navigate(['/consult/history', {id: patient_id}])
  }

  fetchPatients() {
    this.showProgressBar = true
    this.showDataTable = false
    this.patients = []
    this.service.getPatientsConsultation().subscribe((result: dataResponse) => {
      if (result.status == 200) {
        let data = JSON.parse(result.data)        
        for (let index = 0; index < data.length; index++) {
          data[index].dob = calAge(data[index].dob)
          this.patients.push(data[index])
        }
        console.log(this.patients[0])
        this.showDataTable = true
        this.showProgressBar = false
      }

    })
  }
}



