import { Component, OnInit } from '@angular/core';
import * as fabproto6 from 'fabric-protos';
import { FabricService } from 'src/app/services/fabric.service';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  constructor(
    private service: FabricService
  ) { }

  ngOnInit(): void {
    this.service.getBlockHeight().subscribe((result: any) => {
      console.log(result+ ' aa')
      const blockProto = JSON.stringify(fabproto6.common.BlockchainInfo.decode(Buffer.from(result, "utf-8")));

      console.log(blockProto+" d");
      
    })
    
  }

}
