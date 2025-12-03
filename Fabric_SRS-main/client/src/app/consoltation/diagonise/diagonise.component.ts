import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthComponent } from 'src/app/auth/auth/auth.component';
import { patientFull } from 'src/app/interfaces/interfaces';
import { ViewResultImageComponent } from '../view-result-image/view-result-image.component';


@Component({
  selector: 'app-diagonise',
  templateUrl: './diagonise.component.html',
  styleUrls: ['./diagonise.component.css']
})
export class DiagoniseComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) private patient: patientFull,
    private dialog: MatDialog
  ) { }

  visit: any
  ngOnInit(): void {
    console.log(this.patient);
    this.visit = this.patient.visits[this.patient.visits.length-1]
    console.log(this.visit);
    
  }

  openResultImage(url: string) {
    this.dialog.open(ViewResultImageComponent, { data: url})
  }

}
