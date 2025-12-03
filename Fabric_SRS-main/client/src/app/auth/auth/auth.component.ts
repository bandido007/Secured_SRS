import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'
import { simpleResponse } from 'src/app/interfaces/interfaces';
import { FabricService } from '../../services/fabric.service'
import { baseUrl } from '../../configs/config'
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {

  constructor(private router: Router,
    private service: FabricService,
    private snackbar: MatSnackBar) { }


  login(form: any) {
    let input = form.value
    let username = input.username
    let password = input.password

    //  if(username=="reception" && password=="reception"){
    //   this.router.navigate(["/reception/dashboard"])
    //  }
    //  else if(username=="consult" && password=="consult"){
    //   this.router.navigate(["/consult/dashboard"]) 
    //  }

    //  else if(username == "lab" && password=="lab"){
    //   this.router.navigate(["/lab/dashboard"]) 
    //  }



    this.service.enrollUser({ userId: username, userSecret: password }).subscribe((results: any) => {
      if (results.status == 200) {
        window.open(`${baseUrl}download-id/${username}`, '_blank')
        let section = results.section
        console.log(results);
        
        if (section == "reception") {
          this.router.navigate(["/reception/dashboard"])
        }
        else if (section == "consultation") {
          this.router.navigate(["/consult/dashboard"])
        }

        else if (section == "lab") {
          this.router.navigate(["/lab/dashboard"])
        }
        else if (section == "accountant") {
          this.router.navigate(["/account/dashboard"])
        }
        else if (section == 'pharmacy') {
          this.router.navigate(['/pharmacy/dashboard'])
        } else if (section == 'admin') {
          this.router.navigate(['/admin/dashboard'])
        }
      } else if (results.status == 500) {
        this.snackbar.open(results.message, 'Close')
      }
    })


  }
  ngOnInit(): void {
  }

}
