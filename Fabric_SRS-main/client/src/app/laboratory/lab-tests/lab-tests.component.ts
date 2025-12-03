import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { calAge } from 'src/app/configs/config';
import { dataResponse, patientFull, visits } from 'src/app/interfaces/interfaces';
import { FabricService } from 'src/app/services/fabric.service';
import { LabTestComponent } from '../lab-test/lab-test.component';

@Component({
  selector: 'app-lab-tests',
  templateUrl: './lab-tests.component.html',
  styleUrls: ['./lab-tests.component.css']
})
export class LabTestsComponent implements OnInit {
  isLoading=true
  showtable=false

  constructor(private dialog:MatDialog,
    private service: FabricService) { }

  patients: patientFull[] = []
  
  testDialog(id: string, visit: visits) {
    const dialogRef = this.dialog.open(LabTestComponent, { data: {patient_id: id, visit}});
    dialogRef.afterClosed().subscribe(result => {
      this.fetchPatients()
    });
  }
  // TODO: add payment to visits
  ngOnInit(): void {
    this.fetchPatients()
  }

  fetchPatients() {
    this.patients = []
    this.isLoading = true
    this.service.getLabPatients().subscribe((result:dataResponse) => {      
      this.isLoading = false
      this.showtable=true
            if (result.status == 200) {  

        for(let index = 0; index < result.data.length; index++) {
          result.data[index].dob = calAge(result.data[index].dob)
          this.patients.push(result.data[index])
        }
      } else {
        alert('Error occured')
      }
    })
  }

}
