const { application } = require('express')
const { getContract } = require('../Utils/Utils')

const pharmacy = require('express').Router()



pharmacy.post('/addDrug', async (req, res) => {
    const contract = await getContract('pharmacy1')

    let name = req.body.name
    let strength = req.body.strength
    let type = req.body.type
    let quantity = req.body.quantity
    let price = req.body.price
    let vendor_name = req.body.vendor_name
    let location = req.body.location
    let phone = req.body.phone
    let email = req.body.email
    let manu_date = req.body.manu_date
    let exp_date = req.body.exp_date
    let per_maker = req.body.per_maker

    // console.log(req.body);
    let result = await contract.submitTransaction('addDrug', 'Org1', Date.now(), name, strength, type, quantity, price, vendor_name, location,
        phone, email, manu_date, exp_date, per_maker)

    // res.json(JSON.parse(result.toString()))
    // console.log(JSON.parse(result.toString()));
    res.json(JSON.parse(result.toString()))

})

pharmacy.get('/getPatients', async (req, res) => {
    const contract = await getContract('pharmacy1')

    let result = await contract.evaluateTransaction('getPharmacyPatients', 'Org1')
    res.json(JSON.parse(result.toString()))
})

pharmacy.post('/endVisit', async (req, res) => {
    let patient_id = req.body.patient_id
    const contract = await getContract('pharmacy1')

    let result = await contract.submitTransaction('endVisit', 'Org1', patient_id)
    
    res.json(JSON.parse(result.toString()))
})

module.exports = pharmacy