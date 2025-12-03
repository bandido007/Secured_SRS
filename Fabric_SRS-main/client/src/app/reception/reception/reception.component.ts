import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reception',
  templateUrl: './reception.component.html',
  styleUrls: ['./reception.component.css']
})
export class ReceptionComponent implements OnInit {

  constructor(private router:Router) { }
  showFiller = false;

  logout(){

    this.router.navigate(["/auth"])
  }
  ngOnInit(): void {
  }

}
