const { getContract } = require('../Utils/Utils')

const Router = require('express').Router

const reception = Router()


let userId = 'receptionist1'


reception.post('/registerPatient', async (req, res) => {
    let fname = req.body.fname
    let mname = req.body.mname
    let lname = req.body.lname
    let gender = req.body.gender
    let kinName = req.body.kinName
    let phone = req.body.phone
    let plocation = req.body.plocation
    let dob = req.body.dob
    let kinPlace = req.body.kinPlace
    let relationship = req.body.relationship
    let kinPhone = req.body.kinphone

    console.log(req.body);
    let contract = await getContract(userId)
    let result = await contract.submitTransaction('registerPatient', Date.now().toString(), fname,
        mname, lname, gender, kinName, phone, dob, kinPlace,
        relationship, kinPhone, plocation)
        
    result = result.toString()

    if (result == "Done") {
        res.json({status: 200, message: 'Patient registration completed'})
    } else {
        res.json({status: 500, message: 'Server error occured'})
    }
})

reception.post('/sendToConsultation', async (req, res) => {
    let patient_id = req.body.patient_id

    let contract = await getContract(userId)
    let result = await contract.submitTransaction('updatePatientStatus', patient_id, 'Org1', 'consultation')

    res.json(JSON.parse(result.toString()))

})


reception.get('/getPatients', async (req, res) => {
    const contract = await getContract('receptionist1')

    let result = await contract.evaluateTransaction('getReceptionPatients', 'Org1')

    res.json({status: 200, data: result.toString()})
})

module.exports = reception


