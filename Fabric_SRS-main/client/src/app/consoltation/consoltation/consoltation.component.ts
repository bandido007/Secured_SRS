import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-consoltation',
  templateUrl: './consoltation.component.html',
  styleUrls: ['./consoltation.component.css']
})
export class ConsoltationComponent implements OnInit {


  constructor(private router:Router) { }
  showFiller = false;


  logout(){

    this.router.navigate(["/auth"])
  }

  ngOnInit(): void {
  }

}
