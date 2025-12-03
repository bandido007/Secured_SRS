import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { calAge } from 'src/app/configs/config';
import { FabricService } from 'src/app/services/fabric.service';
import {MatAccordion} from '@angular/material/expansion';

@Component({
  selector: 'app-cons-historyform',
  templateUrl: './cons-historyform.component.html',
  styleUrls: ['./cons-historyform.component.css']
})
export class ConsHistoryformComponent implements OnInit {
   @ViewChild(MatAccordion)
  accordion: MatAccordion = new MatAccordion;

  patient_id: string = ""

  isLoading: boolean = true

  patient: any

  visits: any[] = []

  constructor(
    private activeRoute: ActivatedRoute,
    private service: FabricService
  ) { }

  ngOnInit(): void {
    this.activeRoute.params.subscribe((params: any) => {
      this.patient_id = params.id
      this.service.getPatient({patient_id: this.patient_id}).subscribe((result: any) => {
        this.patient = result.data
        this.patient.dob = calAge(result.data.dob)
        this.visits = this.patient.visits
        console.log(this.visits);
      

        this.isLoading = false
      })
    })
  }

}
