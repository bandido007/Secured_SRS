const path = require('path');
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const { buildCAClient, registerUser } = require('../Utils/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../Utils/AppUtil');
const { getContract } = require('../Utils/Utils.js');

const admin = require('express').Router()


admin.use(async (req, res, next) => {
    let ccp = buildCCPOrg1();
    req.caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
    req.wallet = await buildWallet(Wallets, path.join(__dirname, '..', 'wallet'));
    next()
})


admin.post('/registerUser', async (req, res) => {
    let username = req.body.username
    let password = req.body.password
    let mspId = 'Org1MSP'
    let department = 'org1.department1'
    let type = req.body.type

    await registerUser(req.caClient, mspId, username, password, department, req.wallet, type)

    let contract = await getContract('admin')
    let result = await contract.submitTransaction('registerUser', username, 'Org1', type)

    console.log(result.toString() + ' RESULT');

    res.json({
        status: 200,
        message: `${username} is registered successfully`
    })
})

admin.get('/dashboardData', async (req, res) => {
    let contract = await getContract('admin')

    try {
        let users = await contract.evaluateTransaction('getUsers', 'Org1')
        res.json({status: 200, data: {
            users: JSON.parse(users.toString()),
            
        }})
        console.log(users.toString());
    } catch (err) {
        res.json({status: 500, message: 'Failed to get users'})
    }

})


module.exports = admin