import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { prescription, simpleResponse } from 'src/app/interfaces/interfaces';
import { FabricService } from 'src/app/services/fabric.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-receipts',
  templateUrl: './receipts.component.html',
  styleUrls: ['./receipts.component.css']
})
export class ReceiptsComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public patient: any,
    private service: FabricService,
    private dialogRef: MatDialogRef<ReceiptsComponent>
  ) { }

  prescription: any
  total = 0
  payment_status: string = "Nots paid"
  isLoading: boolean = false

  closeSession() {

    Swal.fire({
      title: 'Do you want to end visit?',
      text: "Make sure that the patient has received medicine before ending visit",
      showCancelButton: true,
      confirmButtonText: 'End',
    }).then((result) => {



      if (result.isConfirmed) {
        this.isLoading = true

        this.service.endVisit({ patient_id: this.patient.id }).subscribe((result: simpleResponse) => {
          this.isLoading = false
          if (result.status == 200) {
            Swal.fire('Visit has been ended!', '', 'success')
            this.dialogRef.close()
          }
        })
      }
    })


  }

  ngOnInit(): void {    

    this.prescription = this.patient.visits[this.patient.visits.length - 1].prescription
    this.payment_status = this.patient.visits[this.patient.visits.length - 1].paymentStatus

    this.prescription.forEach((p: any) => {
      this.total += parseInt(p.cost)
    });

  }

}
