import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-laboratory',
  templateUrl: './laboratory.component.html',
  styleUrls: ['./laboratory.component.css']
})
export class LaboratoryComponent implements OnInit {

  constructor(private router:Router) { }

  logout(){

    this.router.navigate(["/auth"])
  }

  ngOnInit(): void {
  }

}
