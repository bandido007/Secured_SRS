
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient } = require('../Utils/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../Utils/AppUtil');

const channelName = 'mychannel';
const chaincodeName = 'basic';
const walletPath = path.join(__dirname, '../wallet');


exports.getContract = async (user) => {
    try {
        ccp = buildCCPOrg1();
        caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
        wallet = await buildWallet(Wallets, walletPath);

        const gateway = new Gateway();

        try {
            await gateway.connect(ccp, {
                wallet,
                identity: user,
                discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
            });

            // console.log(gateway);

            const network = await gateway.getNetwork(channelName);

            // // contract = network.getContract(chaincodeName);

            return network.getContract(chaincodeName);

        } catch (error) {
            console.log(error);
        }
    } catch (error) {
        console.log(error);
    }
}

exports.getQSCC = async (user) => {
    try {
        ccp = buildCCPOrg1();
        caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
        wallet = await buildWallet(Wallets, walletPath);

        const gateway = new Gateway();

        try {
            await gateway.connect(ccp, {
                wallet,
                identity: user,
                discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
            });

            const network = await gateway.getNetwork(channelName);

            return network.getContract('qscc');

        } catch (error) {
            console.log(error);
        }
    } catch (error) {
        console.log(error);
    }
}

