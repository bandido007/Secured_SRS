import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { dataResponse, simpleResponse } from '../interfaces/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FabricService {

  constructor(private http:HttpClient) { }
  base_url:any="http://localhost:5000/"

  enrollUser(data: any) {
    return this.http.post<any>(this.base_url+'enroll', data)
  }

  enrollAdmin(data: any) {
    return this.http.post<any>(this.base_url+'enrollAdmin', data)
  }
 
  AddPatient(data:any){ 
    return this.http.post<simpleResponse>(this.base_url+"reception/registerPatient",data)
  }

  getPatients() {
    return this.http.get<dataResponse>(this.base_url+'reception/getPatients')
  }

  getPatient(patient_id: any) {
    return this.http.post<dataResponse>(this.base_url+'getPatient', patient_id)
  }

  updatePatientStatus(data: any) {
    return this.http.post<simpleResponse>(this.base_url+'reception/sendToConsultation', data)
  }


  // Consultation
  getPatientsConsultation() {
    return this.http.get<dataResponse>(this.base_url+'consultation/getPatients')
  } 

  sendToLab(data: any) {
    return this.http.post<simpleResponse>(this.base_url+"consultation/sendToLab", data)
  }

  addPrescription(data: any) {
    return this.http.post<simpleResponse>(this.base_url+"consultation/sendToAccountant", data)
  } 


  // Lab
  getLabPatients() {
    return this.http.get<dataResponse>(this.base_url+'lab/getPatients')
  }

  addLabResults(data: any) {
    return this.http.post<simpleResponse>(this.base_url+'lab/addLabResults', data)
  }


  // Accountant
  getAccountantPatients() {
    return this.http.get<dataResponse>(this.base_url+'accountant/getPatients')
  }

  changePaymentStatus(data: any) {
    return this.http.post<dataResponse>(this.base_url+"accountant/changePaymentStatus", data)
  }

  sendPatientToPharmacy(data: any) {
    return this.http.post<simpleResponse>(this.base_url+"accountant/sendPatientToPharmacy", data)
  }

  // Pharmacy
  addDrug(data: any) {
    return this.http.post<simpleResponse>(this.base_url+'pharmacy/addDrug', data)
  }

  getPharmacyPatients() {
    return this.http.get<[]>(this.base_url+'pharmacy/getPatients')
  }

  endVisit(data: any) {
    return this.http.post<simpleResponse>(this.base_url+'pharmacy/endVisit', data)
  }


  // All
  getDrugs(){
    return this.http.get<dataResponse>(this.base_url+'getDrugs')
  }

  getDashData() {
    return this.http.get(this.base_url+'getDashData')
  }

  registerUser(data: any) {
    return this.http.post(this.base_url+'admin/registerUser', data)
  }

  getUsers() {
    return this.http.get(this.base_url+'admin/dashboardData')
  }

  // Admin
  // getBlockHeight() {
  //   return this.http.get(this.base_url+'b', { responseType: 'text'})
  // }

}
