const Router = require('express')
const { getContract } = require('../Utils/Utils')

const consultation = Router()

consultation.get('/getPatients', async (_req, res) => {
    const contract = await getContract('doctor1')

    let result = await contract.evaluateTransaction('getConsultationPatients', 'Org1')

    res.json({ status: 200, data: result.toString() })

})

consultation.post('/sendToLab', async (req, res) => {
    console.log(req.body);
    let complain = req.body.complain
    let historyComplain = req.body.historyComplain
    let tests = req.body.tests
    let patient_id = req.body.patient_id

    const contract = await getContract('doctor1')

    let result = await contract.submitTransaction('sendPatientToLab', patient_id, 'Doctor 1', 'Org1', complain, historyComplain, JSON.stringify(tests));

    console.log(result.toString());
    res.json(JSON.parse(result.toString()))

})

consultation.post('/sendToAccountant', async (req, res) => {
    let patient_id = req.body.patient_id
    let prescriptions = req.body.prescriptions

    // console.log(prescriptions);

    const contract = await getContract('doctor1')



    new Promise(async (resolve, _reject) => {
        let pIndex = 0
        for (let index = 0; index < prescriptions.length; index++) {
            const prescription = prescriptions[index];
            prescription.cost = (await contract.evaluateTransaction('calculateDrugCost', 'Org1', prescription.medicine_id, prescription.amount)).toString()
            pIndex++
        }
        resolve(prescriptions)
    }).then(async (Prescriptions) => {
        let result = await contract.submitTransaction('addPrescription', patient_id, 'Org1', JSON.stringify(Prescriptions))

        res.json(JSON.parse(result.toString()))
    }).catch((_err) => {
        res.json({ status: 500 })
    })

})

module.exports = consultation