import { Component, Inject, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { simpleResponse } from 'src/app/interfaces/interfaces';
import { FabricService } from 'src/app/services/fabric.service';

@Component({
  selector: 'app-cons-examform',
  templateUrl: './cons-examform.component.html',
  styleUrls: ['./cons-examform.component.css']
})
export class ConsExamformComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) private patient_id: any,
    private service: FabricService,
    private dialogRef: MatDialogRef<ConsExamformComponent>,
    private snackbar: MatSnackBar
  ) { }

  ngOnInit(): void {
    
  }

  tests: any[] = []
  isLoading: boolean = false

  examine(exam: NgForm) {
    
    this.isLoading = true

    const value = exam.value

    // console.log(value);
    
    this.addTest('FBS',value.FBS)
    this.addTest('RBS', value.RBS)
    this.addTest('TF', value.TF)
    this.addTest('PRBS', value.PRBS)
    this.addTest('RF', value.RF)
    this.addTest('FBC', value.FBC)
    this.addTest('RDT', value.MRD)

    let data = {
      patient_id: this.patient_id,
      complain: value.complain,
      historyComplain: value.historyComplain,
      tests: this.tests
    }

    this.service.sendToLab(data).subscribe((result: simpleResponse) => {
      this.isLoading = false
      if (result.status == 200) {
        this.dialogRef.close()
      }
      this.snackbar.open(result.message, 'close')
    })
    // console.log(this.tests);
    

    
  }

  addTest(Key:string, test: any) {
    console.log(test);
    
    if (test != "" || test == true) {
      this.tests.push({Key})
    }
  }

}
