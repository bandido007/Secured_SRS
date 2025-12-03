import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-view-result-image',
  templateUrl: './view-result-image.component.html',
  styleUrls: ['./view-result-image.component.css']
})
export class ViewResultImageComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public url: string,
    private dialogRef: MatDialogRef<ViewResultImageComponent>
  ) { }

  ngOnInit(): void {
    console.log(this.url)
  }

  closeDialog() {
    this.dialogRef.close()
  }

}
