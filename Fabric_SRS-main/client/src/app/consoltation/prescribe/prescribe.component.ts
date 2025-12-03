import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { dataResponse, simpleResponse } from 'src/app/interfaces/interfaces';
import { FabricService } from 'src/app/services/fabric.service';

@Component({
  selector: 'app-prescribe',
  templateUrl: './prescribe.component.html',
  styleUrls: ['./prescribe.component.css']
})
export class PrescribeComponent implements OnInit {

  medicines: string[] = []
  medicines_id: string[] = []
  pureMedicines: any[] = []

  nums: Number[] = []
  medicineCount: Number[] = [0]
  selectedMedicines: string[] = []
  selectedAmount: string[] = []
  selectedTimesADay: string[] = []
  selectedMedicalIds: string[] = []
  isLoading: boolean = false

  constructor(
    private service: FabricService,
    @Inject(MAT_DIALOG_DATA) private patient_id: any,
    private snackbar: MatSnackBar,
    private dialogRef: MatDialogRef<PrescribeComponent>
  ) { }

  ngOnInit(): void {
    for(let i = 0; i <= 15; i++) this.nums.push(i+1)
    this.service.getDrugs().subscribe((results: dataResponse) => {
      
      if (results.status == 200) {
        console.log(results);
        this.pureMedicines = results.data

        for(let index = 0; index < results.data.length; index++) {
          this.medicines.push(`${results.data[index].name} (${results.data[index].strength}) ${results.data[index].type}`)
          this.medicines_id.push(results.data[index].id)
        }
      }
    })
  }

  numChanged(event: any) {
    // console.log(event);
    this.medicineCount = []
    for(let i = 0; i < event; i++) this.medicineCount.push(0)
    
  }

  addMedicine(index: any, med: any) {
    let med_id = ''
    for(let i = 0; i < this.pureMedicines.length; i++) {
      let name = `${this.pureMedicines[i].name} (${this.pureMedicines[i].strength}) ${this.pureMedicines[i].type}`
      if (med == name) {
        med_id = this.pureMedicines[i].id
        break
      }
    }

    this.selectedMedicines[index] = med
    this.selectedAmount[index] = '1'
    this.selectedMedicalIds[index] = med_id
    
  }

  addAmount(index: any, value: any) {
    this.selectedAmount[index] = value.target.value
  }
  
  addTimesADay(index: any, value: any) {
    this.selectedTimesADay[index] = value
  }

  sendToAccount() {

    let prescriptions = []
    this.isLoading = true
    for(let index = 0; index < this.medicineCount.length; index++) {
      let prescription = {
        medicine: this.selectedMedicines[index],
        amount: parseInt(this.selectedAmount[index]),
        timesaday: parseInt(this.selectedTimesADay[index]),
        medicine_id: this.medicines_id[index]
      }
      prescriptions.push(prescription)
    }
    
    this.service.addPrescription({patient_id: this.patient_id, prescriptions}).subscribe((result: simpleResponse) => {
      this.isLoading = false
      this.snackbar.open(result.message, 'close')
      if (result.status == 200) {
        this.dialogRef.close()
      }
    })
    
    
  }

}
