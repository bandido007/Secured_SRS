import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, NgForm } from '@angular/forms';
import { simpleResponse } from 'src/app/interfaces/interfaces';
import { FabricService } from 'src/app/services/fabric.service';
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-newpatient',
  templateUrl: './newpatient.component.html',
  styleUrls: ['./newpatient.component.css']
})
export class NewpatientComponent implements OnInit {

  campainTwo: FormGroup;
  dob: string = ""
  spinbar=false
  showform=true
  constructor(private service: FabricService,
    private snackbar: MatSnackBar) {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();

    this.campainTwo = new FormGroup({
      start: new FormControl(new Date(year, month, 13)),
      end: new FormControl(new Date(year, month, 16)),
    });

  }

  register(form: NgForm) {



    Swal.fire({
      title: 'Do you want to save this patient?',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Save',
      denyButtonText: `Don't save`,
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        this.spinbar=true
        this.showform=false

        let input = form.value
        let fname = input.fname
        let mname = input.mname
        let lname = input.lname
        let kinName = input.kinName
        let plocation = input.plocation
        let gender = input.gender
        let kinPlace = input.kinPlace
        let relationship = input.relationship
        let dob = input.dob
        let kinphone = input.kinPhone
        let phone = input.phone
    
        this.updateDOB(input.dob)
    
        let data = { fname, mname, lname, gender, kinName, kinPlace, relationship, dob, kinphone, phone, plocation }
        console.log(data);
        
        this.service.AddPatient(data).subscribe((result: simpleResponse) => {
          this.snackbar.open(result.message, "close")
          if (result.status == 200) {
            Swal.fire('Saved!', '', 'success')
        this.spinbar=false
        form.reset()
        this.showform=true

          
          }
        })


        
      } else if (result.isDenied) {
        Swal.fire('user has not been saved', '', 'info')
      }
    })
   
  }

  updateDOB(Date: string) {
    // convert object to string then trim it to yyyy-mm-dd
    // const dob = Date.split(' ')
    console.log(Date);
    
  }
  ngOnInit(): void {
  }

}
