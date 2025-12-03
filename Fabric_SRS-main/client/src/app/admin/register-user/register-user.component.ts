import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { simpleResponse } from 'src/app/interfaces/interfaces';
import { FabricService } from 'src/app/services/fabric.service';

@Component({
  selector: 'app-register-user',
  templateUrl: './register-user.component.html',
  styleUrls: ['./register-user.component.css']
})
export class RegisterUserComponent implements OnInit {

  constructor(
    private service: FabricService,
    private snackbar: MatSnackBar,
    private diaRef: MatDialogRef<RegisterUserComponent>
  ) { }

  ngOnInit(): void {
  }

  registerUser(values: any) {
    
    this.service.registerUser(values).subscribe((result: any) => {
      this.snackbar.open(result.message, "Close")
      if (result.status == 200) {
        this.diaRef.close()
      }
    })
  }
}
