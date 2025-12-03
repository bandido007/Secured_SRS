import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { dataResponse, patient } from 'src/app/interfaces/interfaces';
import { FabricService } from 'src/app/services/fabric.service';
import {MatDialog, MatDialogRef} from '@angular/material/dialog'
import { PaymentmodalComponent } from '../paymentmodal/paymentmodal.component';
import { calAge } from 'src/app/configs/config';

@Component({
  selector: 'app-searchpatient',
  templateUrl: './searchpatient.component.html',
  styleUrls: ['./searchpatient.component.css']
})
export class SearchpatientComponent implements OnInit {

  constructor(
    private service: FabricService,
    private snackbar: MatSnackBar,
    private dialog: MatDialog,
  ) { }
  showProgressBar =true
  showDataTable=false
  patients: patient[] = []

  openDialog(patient_id: any) {
   const ref = this.dialog.open(PaymentmodalComponent, {data: patient_id})
   ref.afterClosed().subscribe((_result)=>{
     this.fetchPatients()
   })
  }

  ngOnInit(): void {
    
    this.fetchPatients()
  }

  fetchPatients() {
    this.patients = []
    this.service.getPatients().subscribe((result: dataResponse) => {
      if (result.status == 200) {
       
        let data = JSON.parse(result.data)
        for (let index = 0; index < data.length; index++) {
          data[index].dob = calAge(data[index].dob)
          this.patients.push(data[index])
        }
        this.showDataTable = true
        this.showProgressBar = false
      } else {
        this.snackbar.open(result.data)
      }
    })
  }

}
