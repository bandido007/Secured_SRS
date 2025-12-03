const { getContract } = require('../Utils/Utils')

const Router  = require('express').Router

const universal = Router()

universal.get('/getPatients', async (req, res) => {
    
    const contract = await getContract('receptionist1')

    let result = await contract.evaluateTransaction('getAllPatients')

    res.json({status: 200, data: result.toString()})
})


module.exports = universal

