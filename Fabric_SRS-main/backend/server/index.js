'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const FabricCAServices = require('fabric-ca-client');
const { Gateway, Wallets } = require('fabric-network');

const { buildCAClient, enrollAdmin, registerAndEnrollUser } = require('./Utils/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('./Utils/AppUtil');
const { getContract } = require('./Utils/Utils.js');

// ============================
// ⚙️ Configuration
// ============================
const channelName = 'mychannel';
const chaincodeName = 'basic';
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
        app.locals.wallet = await buildWallet(Wallets);
        console.log("initialized !!!");
        

    } catch (error) {
    }
}
initFabric()

// ============================
// 🚀 Express Setup
// ============================
const app = express();
app.use(express.json());
app.use(cors());

// Wallet middleware
app.use((req, res, next) => {
    res.locals.wallet = wallet;
    next();
});

// ============================
// 🧾 Routes
// ============================

// 👉 Enroll Admin
app.post('/enrollAdmin', async (req, res) => {
    try {
        const { username, password } = req.body;
        const success = await enrollAdmin(caClient, wallet, username, password, mspOrg1);
        if (!success) return res.status(400).json({ message: 'Failed to enroll admin' });

        const contract = await getContract(username, chaincodeName);
        await contract.submitTransaction('InitLedger');

        res.json({ status: 200, message: '✅ Admin enrolled & ledger initialized' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 👉 Register & Enroll Multiple Users (Lecturer, Student)
app.get('/init', async (req, res) => {
    try {
        await enrollAdmin(caClient, wallet, 'admin', 'adminpw', 'Org1MSP');
        await registerAndEnrollUser(caClient, wallet, mspOrg1, 'lecturer1', 'org1.department1', 'lecturer');
        await registerAndEnrollUser(caClient, wallet, mspOrg1, 'student1', 'org1.department1', 'student');

        res.send('✅ Lecturer and student registered successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('❌ Registration failed');
    }
});

// 👉 Enroll any user (Lecturer or Student)
app.post('/enrollUser', async (req, res) => {
    try {
        const { userId, secret } = req.body;

        const response = await enrollUser(caClient, userId, secret, wallet, mspOrg1);
        if (!response) return res.status(400).json({ message: 'User enrollment failed' });

        const contract = await getContract(userId, chaincodeName);
        const attr = await contract.evaluateTransaction('getUserAttrs');
        const parsed = JSON.parse(attr.toString());

        res.json({ status: 200, user: parsed });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Enrollment error' });
    }
});

// 👉 Create a new student
app.post('/createStudent', async (req, res) => {
    try {
        const contract = await getContract('admin', chaincodeName);
        const response = await contract.submitTransaction('createStudent', JSON.stringify(req.body));
        res.json(JSON.parse(response.toString()));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create student' });
    }
});

// 👉 Get a specific student
app.get('/getStudent/:studentId', async (req, res) => {
    try {
        const contract = await getContract('admin', chaincodeName);
        const response = await contract.evaluateTransaction('getStudent', req.params.studentId);
        res.json(JSON.parse(response.toString()));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch student' });
    }
});

// 👉 List all students
app.get('/listStudents', async (req, res) => {
    try {
        const contract = await getContract('admin', chaincodeName);
        const response = await contract.evaluateTransaction('listStudents');
        res.json(JSON.parse(response.toString()));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to list students' });
    }
});

// 👉 Create a new lecturer
app.post('/createLecturer', async (req, res) => {
    try {
        const contract = await getContract('admin', chaincodeName);
        const response = await contract.submitTransaction('createLecturer', JSON.stringify(req.body));
        res.json(JSON.parse(response.toString()));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create lecturer' });
    }
});

// 👉 List all lecturers
app.get('/listLecturers', async (req, res) => {
    try {
        const contract = await getContract('admin', chaincodeName);
        const response = await contract.evaluateTransaction('listLecturers');
        res.json(JSON.parse(response.toString()));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to list lecturers' });
    }
});

// 👉 Add a new course
app.post('/addCourse', async (req, res) => {
    try {
        const contract = await getContract('lecturer1', chaincodeName);
        const response = await contract.submitTransaction('createCourse', JSON.stringify(req.body));
        res.json(JSON.parse(response.toString()));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add course' });
    }
});

// 👉 List all courses
app.get('/listCourses', async (req, res) => {
    try {
        const contract = await getContract('student1', chaincodeName);
        const response = await contract.evaluateTransaction('listCourses');
        res.json(JSON.parse(response.toString()));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to list courses' });
    }
});

// 👉 Enroll a student in a course
app.post('/enrollStudent', async (req, res) => {
    try {
        const contract = await getContract('admin', chaincodeName);
        const response = await contract.submitTransaction('createEnrollment', JSON.stringify(req.body));
        res.json(JSON.parse(response.toString()));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to enroll student' });
    }
});

// 👉 Submit course grades
app.post('/submitGrade', async (req, res) => {
    try {
        const contract = await getContract('lecturer1', chaincodeName);
        const response = await contract.submitTransaction('submitGrade', JSON.stringify(req.body));
        res.json(JSON.parse(response.toString()));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to submit grade' });
    }
});

// 👉 Verify a grade
app.get('/verifyGrade/:resultId', async (req, res) => {
    try {
        const contract = await getContract('admin', chaincodeName);
        const response = await contract.evaluateTransaction('verifyGrade', req.params.resultId);
        res.json(JSON.parse(response.toString()));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to verify grade' });
    }
});

// 👉 Get grade audit trail
app.get('/getGradeAudit/:resultId', async (req, res) => {
    try {
        const contract = await getContract('admin', chaincodeName);
        const response = await contract.evaluateTransaction('getGradeAuditTrail', req.params.resultId);
        res.json(JSON.parse(response.toString()));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch grade audit trail' });
    }
});

// 👉 Generate transcript
app.post('/generateTranscript', async (req, res) => {
    try {
        const contract = await getContract('admin', chaincodeName);
        const response = await contract.submitTransaction('generateTranscript', JSON.stringify(req.body));
        res.json(JSON.parse(response.toString()));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate transcript' });
    }
});

// 👉 List transcripts for a student
app.get('/listTranscripts/:studentId', async (req, res) => {
    try {
        const contract = await getContract('admin', chaincodeName);
        const response = await contract.evaluateTransaction('listTranscripts', req.params.studentId);
        res.json(JSON.parse(response.toString()));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch transcripts' });
    }
});

// 👉 Initialize ledger
app.get('/initLedger', async (req, res) => {
    try {
        const contract = await getContract('admin', chaincodeName);
        const result = await contract.submitTransaction('InitLedger');
        res.json({ status: 200, message: result.toString() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ledger init failed' });
    }
});

// ============================
// 🏁 Start Server
// ============================
const PORT = 4000;
app.listen(PORT, () => console.log(`✅ Server listening on port ${PORT}`));
