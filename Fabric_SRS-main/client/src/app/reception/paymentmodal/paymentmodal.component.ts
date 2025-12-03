import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { simpleResponse } from 'src/app/interfaces/interfaces';
import { FabricService } from 'src/app/services/fabric.service';

@Component({
  selector: 'app-paymentmodal',
  templateUrl: './paymentmodal.component.html',
  styleUrls: ['./paymentmodal.component.css']
})
export class PaymentmodalComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) private patient_id: any,
    private service: FabricService,
    private snackbar: MatSnackBar,
    private dialogRef: MatDialogRef<PaymentmodalComponent>
  ) { }

  isLoading: boolean = false
  
  ngOnInit(): void {
  }

  toConsultation(type: string) {
    this.isLoading = true
    this.service.updatePatientStatus({patient_id: this.patient_id, type}).subscribe((result:simpleResponse) => {
      this.isLoading = false
      if (result.status == 200) {
        this.snackbar.open("Patient sent to consultation successfully", "Close")
        this.dialogRef.close()
      } else {
        this.snackbar.open("Server error occured, Try again", "Close")
      }
    })
  }

}


