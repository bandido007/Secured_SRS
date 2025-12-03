import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pharmacy',
  templateUrl: './pharmacy.component.html',
  styleUrls: ['./pharmacy.component.css']
})
export class PharmacyComponent implements OnInit {

  constructor(private router:Router) { }
  logout(){
    this.router.navigate(["/auth"])
  }
  ngOnInit(): void {
  }

}
