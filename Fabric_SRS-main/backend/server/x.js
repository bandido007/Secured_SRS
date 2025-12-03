'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const FabricCAServices = require('fabric-ca-client');
const { Gateway, Wallets } = require('fabric-network');

const { buildCAClient, enrollAdmin, registerAndEnrollUser } = require('./Utils/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('./Utils/AppUtil');

// ============================
// ⚙️ Configuration
// ============================
const channelName = 'mychannel';
const chaincodeName = 'srs'; // Your SRS contract name
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const caHost = 'ca.org1.example.com';

let ccp, caClient, wallet;

// ============================
// 🧩 Init Fabric Setup
// ============================
async function initFabric() {
    try {
        ccp = buildCCPOrg1();
        caClient = buildCAClient(FabricCAServices, ccp, caHost);
        wallet = await buildWallet(Wallets, walletPath);
        console.log('✅ Fabric initialized');
    } catch (err) {
        console.error('❌ Fabric initialization failed:', err);
        process.exit(1);
    }
}

// ============================
// 📋 Helper: Get Contract
// ============================
async function getContract(userId) {
    try {
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: userId,
            discovery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork(channelName);
        const contract = network.getContract(chaincodeName);
        return { gateway, contract };
    } catch (err) {
        console.error('Failed to get contract:', err);
        throw err;
    }
}

// ============================
// 🚀 Express Setup
// ============================
const app = express();
app.use(express.json());
app.use(cors());

// ============================
// 🔐 Authentication Routes
// ============================

app.post('/auth/enroll-admin', async (req, res) => {
    try {
        const { adminId = 'admin', adminPassword = 'adminpw' } = req.body;
        await enrollAdmin(caClient, wallet, adminId, adminPassword, mspOrg1);
        
        const { contract, gateway } = await getContract(adminId);
        await contract.submitTransaction('InitLedger');
        await gateway.disconnect();

        res.json({ status: 200, message: '✅ Admin enrolled & ledger initialized' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Admin enrollment failed' });
    }
});

app.post('/auth/register-user', async (req, res) => {
    try {
        const { userId, department = 'org1.department1', role } = req.body;
        
        if (!userId || !role) {
            return res.status(400).json({ error: 'userId and role required' });
        }

        await registerAndEnrollUser(caClient, wallet, mspOrg1, userId, department, role);
        res.json({ status: 200, message: `✅ User ${userId} registered successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'User registration failed' });
    }
});

// ============================
// 👨‍🎓 Student Routes
// ============================

app.post('/students', async (req, res) => {
    try {
        const { userId } = req.body;
        const { contract, gateway } = await getContract(userId);

        const response = await contract.submitTransaction('createStudent', JSON.stringify(req.body));
        await gateway.disconnect();

        res.json({ status: 200, data: JSON.parse(response.toString()) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create student' });
    }
});

app.get('/students/:studentId', async (req, res) => {
    try {
        const { contract, gateway } = await getContract('student1');
        const response = await contract.evaluateTransaction('getStudent', req.params.studentId);
        await gateway.disconnect();

        res.json(JSON.parse(response.toString()));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch student' });
    }
});

app.get('/students', async (req, res) => {
    try {
        const { contract, gateway } = await getContract('student1');
        const response = await contract.evaluateTransaction('listStudents');
        await gateway.disconnect();

        res.json(JSON.parse(response.toString()));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to list students' });
    }
});

app.put('/students/:studentId', async (req, res) => {
    try {
        const { userId } = req.body;
        const { contract, gateway } = await getContract(userId);

        const response = await contract.submitTransaction(
            'updateStudent',
            req.params.studentId,
            JSON.stringify(req.body)
        );
        await gateway.disconnect();

        res.json({ status: 200, data: JSON.parse(response.toString()) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update student' });
    }
});

app.delete('/students/:studentId', async (req, res) => {
    try {
        const { userId } = req.body;
        const { contract, gateway } = await getContract(userId);

        const response = await contract.submitTransaction('deactivateStudent', req.params.studentId);
        await gateway.disconnect();

        res.json({ status: 200, message: 'Student deactivated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to deactivate student' });
    }
});

// ============================
// 👨‍🏫 Lecturer Routes
// ============================

app.post('/lecturers', async (req, res) => {
    try {
        const { userId } = req.body;
        const { contract, gateway } = await getContract(userId);

        const response = await contract.submitTransaction('createLecturer', JSON.stringify(req.body));
        await gateway.disconnect();

        res.json({ status: 200, data: JSON.parse(response.toString()) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create lecturer' });
    }
});

app.get('/lecturers', async (req, res) => {
    try {
        const { contract, gateway } = await getContract('lecturer1');
        const response = await contract.evaluateTransaction('listLecturers');
        await gateway.disconnect();

        res.json(JSON.parse(response.toString()));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to list lecturers' });
    }
});

// ============================
// 📚 Course Routes
// ============================

app.post('/courses', async (req, res) => {
    try {
        const { userId } = req.body;
        const { contract, gateway } = await getContract(userId);

        const response = await contract.submitTransaction('createCourse', JSON.stringify(req.body));
        await gateway.disconnect();

        res.json({ status: 200, data: JSON.parse(response.toString()) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create course' });
    }
});

app.get('/courses', async (req, res) => {
    try {
        const { contract, gateway } = await getContract('student1');
        const response = await contract.evaluateTransaction('listCourses');
        await gateway.disconnect();

        res.json(JSON.parse(response.toString()));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to list courses' });
    }
});

// ============================
// ✏️ Enrollment Routes
// ============================

app.post('/enrollments', async (req, res) => {
    try {
        const { userId } = req.body;
        const { contract, gateway } = await getContract(userId);

        const response = await contract.submitTransaction('createEnrollment', JSON.stringify(req.body));
        await gateway.disconnect();

        res.json({ status: 200, data: JSON.parse(response.toString()) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create enrollment' });
    }
});

app.get('/enrollments', async (req, res) => {
    try {
        const { contract, gateway } = await getContract('student1');
        const response = await contract.evaluateTransaction('listEnrollments');
        await gateway.disconnect();

        res.json(JSON.parse(response.toString()));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to list enrollments' });
    }
});

// ============================
// 📊 Course Result/Grade Routes
// ============================

app.post('/grades', async (req, res) => {
    try {
        const { userId } = req.body;
        const { contract, gateway } = await getContract(userId);

        const response = await contract.submitTransaction('submitGrade', JSON.stringify(req.body));
        await gateway.disconnect();

        res.json({ status: 200, data: JSON.parse(response.toString()) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to submit grade' });
    }
});

app.put('/grades/:resultId/verify', async (req, res) => {
    try {
        const { userId } = req.body;
        const { contract, gateway } = await getContract(userId);

        const response = await contract.submitTransaction('verifyGrade', req.params.resultId);
        await gateway.disconnect();

        res.json({ status: 200, message: 'Grade verified', data: JSON.parse(response.toString()) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to verify grade' });
    }
});

app.get('/grades/:resultId/audit-trail', async (req, res) => {
    try {
        const { contract, gateway } = await getContract('student1');
        const response = await contract.evaluateTransaction('getGradeAuditTrail', req.params.resultId);
        await gateway.disconnect();

        res.json(JSON.parse(response.toString()));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch audit trail' });
    }
});

// ============================
// 📜 Transcript Routes
// ============================

app.post('/transcripts', async (req, res) => {
    try {
        const { userId } = req.body;
        const { contract, gateway } = await getContract(userId);

        const response = await contract.submitTransaction('generateTranscript', JSON.stringify(req.body));
        await gateway.disconnect();

        res.json({ status: 200, data: JSON.parse(response.toString()) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate transcript' });
    }
});

app.get('/transcripts/:studentId', async (req, res) => {
    try {
        const { contract, gateway } = await getContract('student1');
        const response = await contract.evaluateTransaction('listTranscripts', req.params.studentId);
        await gateway.disconnect();

        res.json(JSON.parse(response.toString()));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch transcripts' });
    }
});

// ============================
// 🏁 Start Server
// ============================
initFabric().then(() => {
    app.listen(3000, () => {
        console.log('✅ SRS Server listening on port 3000');
    });
}).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});