/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('./Utils/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('./Utils/AppUtil');

const channelName = 'mychannel';
const chaincodeName = 'basic';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, '../server/wallet');
const org1UserId = 'receptionist';

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

async function main() {
	try {
		// build an in memory object with the network configuration (also known as a connection profile)
		const ccp = buildCCPOrg1();

		// build an instance of the fabric ca services client based on
		// the information in the network configuration
		// const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath);

		// await enrollAdmin(caClient, wallet, mspOrg1);

		// await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');

		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.
		const gateway = new Gateway();

		try {
			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			await gateway.connect(ccp, {
				wallet,
				identity: org1UserId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork(channelName);

			// Get the contract from the network.
			const contract = network.getContract(chaincodeName);

			
			// console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger');
			// await contract.submitTransaction('InitLedger');
			// console.log('*** Result: committed');

			
			
			// console.log('Get all orgs');
			// let result = await contract.evaluateTransaction('getAllOrgs');
			// console.log(`*** Result: ${result.toString()}`);

			// console.log('register patient')
			// let result = await contract.submitTransaction('registerPatient', Date.now().toString(), 'lusajo',
			// 'menard','shitindi', 'Male', 'menard shitindi', '07333', '30-29-2222', 'Mbeya',
			// 'Father', '0443333')
			// console.log(`*** Result ${result.toString()}`);

			// result = await contract.submitTransaction('isPatientRegistered', 'lusajo')
			// console.log(result.toString());

			console.log('Get all orgs');
			var result = await contract.evaluateTransaction('getAllPatients');
			console.log(`*** Result: ${result.toString()}`);

			// console.log('Get reception patients');
			// let result = await contract.submitTransaction('enterPatientTests', '1651991403273', 'Org1','s');
			// console.log(`*** Result: ${result}`);

			// console.log('Get reception patients');
			// result = await contract.submitTransaction('sendPatientToLab', '1651455923934', 'Joh', 'Org1', 'Headache','Last week', JSON.stringify([{NAME:'HH'}]));
			// console.log(`*** Result: ${result}`);

			// console.log('Update patient status');
			// result = await contract.submitTransaction('updatePatientStatus', '333','Org1', 'consult');
			// console.log(`*** Result: ${result.toString()}`);

			// console.log('Get reception patients');
			// result = await contract.submitTransaction('getReceptionPatients', 'Org1');
			// console.log(`*** Result: ${result.toString()}`);
			// console.log('\n--> Submit Transaction: CreateAsset, creates new asset with ID, color, owner, size, and appraisedValue arguments');
			// result = await contract.submitTransaction('CreateAsset', 'asset13', 'yellow', '5', 'Tom', '1300');
			// console.log('*** Result: committed');
			// if (`${result}` !== '') {
			// 	console.log(`*** Result: ${prettyJSONString(result.toString())}`);
			// }

			// console.log('\n--> Evaluate Transaction: ReadAsset, function returns an asset with a given assetID');
			// result = await contract.evaluateTransaction('ReadAsset', 'asset13');
			// console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			// console.log('\n--> Evaluate Transaction: AssetExists, function returns "true" if an asset with given assetID exist');
			// result = await contract.evaluateTransaction('AssetExists', 'asset1');
			// console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			// console.log('\n--> Submit Transaction: UpdateAsset asset1, change the appraisedValue to 350');
			// await contract.submitTransaction('UpdateAsset', 'asset1', 'blue', '5', 'Tomoko', '350');
			// console.log('*** Result: committed');

			// console.log('\n--> Evaluate Transaction: ReadAsset, function returns "asset1" attributes');
			// result = await contract.evaluateTransaction('ReadAsset', 'asset1');
			// console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			// try {
				
			// 	console.log('\n--> Submit Transaction: UpdateAsset asset70, asset70 does not exist and should return an error');
			// 	await contract.submitTransaction('UpdateAsset', 'asset70', 'blue', '5', 'Tomoko', '300');
			// 	console.log('******** FAILED to return an error');
			// } catch (error) {
			// 	console.log(`*** Successfully caught the error: \n    ${error}`);
			// }

			// console.log('\n--> Submit Transaction: TransferAsset asset1, transfer to new owner of Tom');
			// await contract.submitTransaction('TransferAsset', 'asset1', 'Tom');
			// console.log('*** Result: committed');

			// console.log('\n--> Evaluate Transaction: ReadAsset, function returns "asset1" attributes');
			// result = await contract.evaluateTransaction('ReadAsset', 'asset1');
			// console.log(`*** Result: ${prettyJSONString(result.toString())}`);
		} finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
		}
	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
	}
}

main();
