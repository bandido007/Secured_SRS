const { getContract } = require('../Utils/Utils');

const lab = require('express').Router()


lab.get('/getPatients', async (req, res) => {
    let contract = await getContract('technician1');
    let result = await contract.submitTransaction('getLabPatients', 'Org1');
    res.json({status: 200, data: JSON.parse(result.toString())})
})

lab.post('/addLabResults', async (req, res) => {
    let patient_id = req.body.patient_id
    let visit = req.body.visit

    let contract = await getContract('technician1')

    let result = await contract.submitTransaction('enterPatientTests', patient_id, 'Org1', JSON.stringify(visit))

    let json = JSON.parse(result.toString())
    if (json.status == 200) {
        res.json(json)
    } else res.json({ status: 500, message: 'Failed to save patient\'s lab results'})
})


module.exports = lab