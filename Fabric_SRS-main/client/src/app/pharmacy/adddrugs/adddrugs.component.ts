import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { simpleResponse } from 'src/app/interfaces/interfaces';
import { FabricService } from 'src/app/services/fabric.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-adddrugs',
  templateUrl: './adddrugs.component.html',
  styleUrls: ['./adddrugs.component.css']
})
export class AdddrugsComponent implements OnInit {

  constructor(
    private service: FabricService,
    private snackbar: MatSnackBar
  ) { }

  isLoading: boolean = false


  addDrug(form: NgForm) {
    let values = form.value

    let name = values.gname
    let strength = values.strength
    let type = values.drugtype
    let quantity = values.quantity
    let price = values.price
    let per_maker = values.permaker
    let vendor_name = values.vendor
    let location = values.location
    let phone = values.contacts
    let email = values.email
    let manu_date = values.manufactureddate
    let exp_date = values.expiredate

    this.isLoading = true

    this.service.addDrug({
      name, strength, type, quantity,
      price, per_maker, vendor_name, location, phone, email, manu_date,
      exp_date
    }).subscribe((result: simpleResponse) => {
      this.isLoading = false
      this.snackbar.open(result.message, 'close')
      if (result.status == 200) {
        form.reset()
      }
    })

  }

  ngOnInit(): void {
  }


}
