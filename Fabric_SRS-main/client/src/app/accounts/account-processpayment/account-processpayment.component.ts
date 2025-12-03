import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { calAge } from 'src/app/configs/config';
import { dataResponse, patientFull } from 'src/app/interfaces/interfaces';
import { FabricService } from 'src/app/services/fabric.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-account-processpayment',
  templateUrl: './account-processpayment.component.html',
  styleUrls: ['./account-processpayment.component.css']
})
export class AccountProcesspaymentComponent implements OnInit {

  showProgressBar =true
  showDataTable=true
  patients: patientFull[] = []
 
  constructor(
    private service: FabricService,
    private router: Router
  ) { }


  insurance(){
    Swal.fire({
      title: 'Do you want to pay by cash?',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Save',
      denyButtonText: `Don't save`,
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        Swal.fire('Payment hass bee settled succeffuly!', '', 'success')
      } else if (result.isDenied) {
        Swal.fire('Payment terminated', '', 'info')
      }
    })

  }

  ngOnInit(): void {
    this.fetchPatients()
  }

  fetchPatients() {
    this.showProgressBar = true
    this.showDataTable = false
    this.patients = []
    this.service.getAccountantPatients().subscribe((result: dataResponse) => {
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

  viewReceipt(patient: any) {
    this.router.navigate(['/account/receipt', {pid: JSON.stringify(patient)}])
  }

}
