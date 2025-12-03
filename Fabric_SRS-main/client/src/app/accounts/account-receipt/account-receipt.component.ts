import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { dataResponse, Medicine, patientFull, prescription, simpleResponse } from 'src/app/interfaces/interfaces';
import { FabricService } from 'src/app/services/fabric.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-account-receipt',
  templateUrl: './account-receipt.component.html',
  styleUrls: ['./account-receipt.component.css']
})
export class AccountReceiptComponent implements OnInit {

  patient_id: string = ""
  total: number = 0
  patient_data: any = {
    id: '',
    dob: '',
    fname: '',
    mname: '',
    lname: '',
    plocation: '',
    gender: '',
    kinName: '',
    kinPhone: '',
    kinPlace: '',
    phone: '',
    relationship: '',
    visits: [],
  }
  payment_status: string = "Not paid"
  medicines: any = []
  isLoading: boolean = false
  isPharmacyLoading: boolean = false
  constructor(
    private Activerouter: ActivatedRoute,
    private router: Router,
    private service: FabricService,
    private snackBar: MatSnackBar
  ) {
    
   }

  printReceipt(){
    Swal.fire({
      title: 'Do you want to change payment status?',
      showDenyButton: true,
      showCancelButton: false,
      confirmButtonText: 'yes',
      denyButtonText: 'Cancel'
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        this.isLoading = true
        this.service.changePaymentStatus({patient_id: this.patient_id, status: 'Paid'}).subscribe((result: dataResponse) => {
          this.isLoading = false
          if (result.status == 200) {
            this.payment_status = 'Paid'
            Swal.fire('Payment status have been updated successfully', '', 'success')
          } else {
            this.snackBar.open('Failed to change payment status, Try again', 'close')
          }
        })
      } else if (result.isDenied) {
        Swal.fire('Cancelled', '', 'info')
      }
    })
  }

  sendToPharmacy() {
    this.isPharmacyLoading = true
    this.service.sendPatientToPharmacy({patient_id: this.patient_id}).subscribe((result: simpleResponse) => {
      this.isPharmacyLoading = false
      if (result.status = 200) {
        this.router.navigate(['/account/processpayment'])
      }
    })
  }

  ngOnInit(): void {
    this.Activerouter.params.subscribe((data)=>{
      this.patient_id = JSON.parse(JSON.stringify(data)).pid.split("\"")[1]
      this.service.getPatient({patient_id: this.patient_id}).subscribe((result: dataResponse) => {
        if (result.status == 200) {
          this.patient_data = result.data
          this.medicines = this.patient_data.visits[this.patient_data.visits.length-1].prescription
          if (this.patient_data.visits[this.patient_data.visits.length-1].paymentStatus) {
            this.payment_status = this.patient_data.visits[this.patient_data.visits.length-1].paymentStatus
          }
          this.service.getDrugs().subscribe((drugs: dataResponse) => {
            let Drugs = drugs.data
            this.medicines.forEach((medicine: any) => {
              Drugs.forEach((drug: any) => {
                medicine.price = drug.price
              });
              this.total += parseInt(medicine.cost)
            });
            
          })
        }
      })
    })
  }

}
