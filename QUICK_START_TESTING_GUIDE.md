# Quick Start Testing Guide - Secured SRS POC 🧪

**Date:** December 3, 2025
**Purpose:** Step-by-step guide to test the blockchain grade update feature
**Time Required:** 30 minutes

---

## 🎯 What You'll Test

1. ✅ Submit grade to blockchain
2. ✅ Update grade with audit trail
3. ✅ View complete version history
4. ✅ Verify blockchain integrity
5. ✅ Confirm immutability preservation

---

## 🚀 Step-by-Step Testing

### Step 1: Start All Services (5 minutes)

#### Terminal 1: Start Fabric Network

```bash
cd /home/administrator/secured_SRS/Fabric_SRS-main/backend/network
./network.sh down  # Clean up if running
./network.sh up createChannel -c mychannel -ca

# Expected output:
# ✅ Creating network "fabric_test"
# ✅ Creating peer0.org1.example.com
# ✅ Creating orderer.example.com
# ✅ Channel 'mychannel' created
```

#### Terminal 2: Deploy Chaincode

```bash
cd /home/administrator/secured_SRS/Fabric_SRS-main/backend
./network/network.sh deployCC \
  -ccn basic \
  -ccp ./chaincode \
  -ccl javascript

# Expected output:
# ✅ Chaincode installed on peer0.org1
# ✅ Chaincode approved by Org1
# ✅ Chaincode committed to channel
# ✅ Chaincode definition committed on channel 'mychannel'
```

#### Terminal 3: Start Node.js Gateway

```bash
cd /home/administrator/secured_SRS/Fabric_SRS-main/backend/server
npm install  # First time only
node index.js

# Expected output:
# initialized !!!
# Server running on port 3000
```

**✅ Checkpoint:** Node.js server should be running on http://localhost:3000

#### Terminal 4: Start Django Backend

```bash
cd /home/administrator/secured_SRS
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000

# Expected output:
# Django version 3.x, using settings 'secured_SRS.settings'
# Starting development server at http://0.0.0.0:8000/
# Quit the server with CONTROL-C.
```

**✅ Checkpoint:** Django should be running on http://localhost:8000

#### Terminal 5: Start Frontend

```bash
cd /home/administrator/secured_SRS/frontend
npm install  # First time only
npm run dev

# Expected output:
# VITE v4.x ready in XXX ms
# ➜ Local: http://localhost:3000
```

**✅ Checkpoint:** Frontend accessible at http://localhost:3000

---

### Step 2: Initial Setup (2 minutes)

#### Initialize Blockchain Ledger

```bash
# In a new terminal
curl http://localhost:3000/init

# Expected response:
# ✅ Lecturer and student registered successfully
```

#### Verify Connection

```bash
# Test blockchain connectivity
curl http://localhost:3000/listCourses

# Should return:
# [{"courseId":"CS101","courseName":"Introduction to Programming",...}]
```

---

### Step 3: Submit Initial Grade (3 minutes)

#### Via Frontend UI:

1. **Login as Lecturer**
   - Go to http://localhost:3000
   - Username: `lecturer@example.com`
   - Password: (your lecturer password)

2. **Navigate to Grade Submission**
   - Dashboard → Grade Management
   - Click "Submit New Grade"

3. **Fill Form**
   ```
   Student: John Doe (S2021001234)
   Course: CS101 - Introduction to Programming
   Grade Type: NUMERIC
   Numeric Grade: 65
   Coursework Grade: 30
   Exam Grade: 35
   Remarks: Initial submission
   ```

4. **Submit**
   - Click "Submit Grade"
   - Wait for success message

5. **Verify Submission**
   - Should see grade in the list
   - Status: PENDING
   - Note the Grade ID (e.g., 123)

#### Via API (Alternative):

```bash
curl -X POST http://localhost:8000/api/srs-domain/course-results \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "enrollmentId": 1,
    "gradeType": "NUMERIC",
    "numericGrade": 65,
    "courseWorkGrade": 30,
    "examGrade": 35,
    "remarks": "Initial submission"
  }'

# Expected response:
# {"response":{"status":true,"message":"Grade submitted successfully"}}
```

**✅ Checkpoint:** Grade should be visible in database AND blockchain

**Verify in Blockchain:**
```bash
# Check Node.js terminal logs
# Should see: POST /submitGrade 200
```

---

### Step 4: Update Grade (5 minutes)

#### Via Frontend UI:

1. **Find Your Grade**
   - Go to Grade Management page
   - Find the grade you just submitted (Status: PENDING)
   - Should see an "Edit" button

2. **Click Edit**
   - Edit modal opens
   - Pre-filled with current values

3. **Make Changes**
   ```
   Numeric Grade: 65 → 85
   Coursework Grade: 30 → 40
   Exam Grade: 35 → 45
   Remarks: Excellent improvement
   Update Reason: Calculation error - missed partial credit on questions 3 and 5
   ```

4. **Submit Update**
   - Click "Update Grade"
   - Wait for success message
   - Should see: "Grade updated successfully. Verification status reset to PENDING."

**✅ Checkpoint:** Grade should be updated in database AND blockchain

**Verify in Blockchain:**
```bash
# Check Node.js terminal logs
# Should see: PUT /updateGrade/result_1 200
# Response should include:
#   - transactionId: txn_update_xxx
#   - previousHash: ABC123...
#   - newHash: DEF456...
#   - changesCount: 3
```

#### Via API (Alternative):

```bash
curl -X PUT http://localhost:8000/api/srs-domain/course-results/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "enrollmentId": 1,
    "gradeType": "NUMERIC",
    "numericGrade": 85,
    "courseWorkGrade": 40,
    "examGrade": 45,
    "remarks": "Excellent improvement",
    "comments": "Calculation error corrected"
  }'
```

---

### Step 5: View Version History (5 minutes)

#### Via Frontend UI:

1. **Click "View History"**
   - On the updated grade row
   - Click the history icon or "View History" button

2. **Observe Timeline**
   - Should see 2 versions:

     **Version 1 (CREATE):**
     ```
     Type: CREATE
     Date: [Your submission date]
     Performer: Dr. Smith (lecturer1)
     Grade: 65
     ```

     **Version 2 (UPDATE):**
     ```
     Type: UPDATE
     Date: [Your update date]
     Performer: Dr. Smith (lecturer1)
     Reason: Calculation error corrected
     Changes:
       - numericGrade: 65 → 85
       - courseWorkGrade: 30 → 40
       - examGrade: 35 → 45
     ```

3. **Expand Version Details**
   - Click on Version 2
   - Should see side-by-side comparison table:

   | Field | Old Value | New Value |
   |-------|-----------|-----------|
   | Grade Type | NUMERIC | NUMERIC |
   | Numeric Grade | 65 | 85 |
   | Coursework | 30 | 40 |
   | Exam | 35 | 45 |
   | Remarks | Initial | Excellent improvement |

4. **Verify Blockchain Status**
   - Should see green checkmark: "✅ Blockchain Integrity Verified"
   - DB Hash matches BC Hash

**✅ Checkpoint:** Complete history visible with all changes documented

#### Via API (Alternative):

```bash
curl http://localhost:8000/api/srs-domain/course-results/123/version-history \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected response:
# {
#   "response": {"status": true, "message": "Version history retrieved successfully"},
#   "data": {
#     "gradeId": 123,
#     "versionHistory": [
#       {
#         "versionNumber": 1,
#         "transactionType": "CREATE",
#         "timestamp": "2025-11-15T10:30:00Z",
#         "newValues": {"numericGrade": 65, ...}
#       },
#       {
#         "versionNumber": 2,
#         "transactionType": "UPDATE",
#         "timestamp": "2025-11-20T14:45:00Z",
#         "oldValues": {"numericGrade": 65, ...},
#         "newValues": {"numericGrade": 85, ...},
#         "changes": [...]
#       }
#     ],
#     "totalVersions": 2
#   }
# }
```

---

### Step 6: Verify Integrity (3 minutes)

#### Via Frontend UI:

1. **Click "Verify Integrity"**
   - Button on grade details page
   - System performs real-time check

2. **Observe Results**
   ```
   ✅ Status: VERIFIED
   ✅ Database Hash: DEF456ABC789...
   ✅ Blockchain Hash: DEF456ABC789...
   ✅ Computed Hash: DEF456ABC789...
   ✅ Match: YES
   ✅ Message: "Integrity verified - data matches blockchain hash"
   ```

**✅ Checkpoint:** All hashes match, integrity confirmed

#### Via API (Alternative):

```bash
curl http://localhost:8000/api/srs-domain/course-results/123/verify-integrity \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected response:
# {
#   "response": {
#     "status": true,
#     "message": "Integrity verified - data matches blockchain hash"
#   },
#   "data": {
#     "gradeId": 123,
#     "isValid": true,
#     "status": "VERIFIED",
#     "databaseHash": "DEF456...",
#     "blockchainHash": "DEF456...",
#     "verified": true
#   }
# }
```

---

### Step 7: Test Immutability (5 minutes)

#### Attempt to Update OFFICIAL Grade:

1. **Make Grade Official**
   ```bash
   # Via admin account
   curl -X POST http://localhost:8000/api/srs-domain/course-results/123/verify \
     -H "Authorization: Bearer ADMIN_TOKEN"
   ```

2. **Try to Update Again**
   - Go to Grade Management
   - Notice: NO "Edit" button for OFFICIAL grades
   - Edit button only visible for PENDING grades

3. **Attempt API Update (Should Fail)**
   ```bash
   curl -X PUT http://localhost:8000/api/srs-domain/course-results/123 \
     -H "Authorization: Bearer LECTURER_TOKEN" \
     -d '{"numericGrade": 100}'

   # Expected response:
   # {"response":{"status":false,"message":"Cannot update verified grades"}}
   ```

**✅ Checkpoint:** OFFICIAL grades are immutable, cannot be edited

---

### Step 8: Verify Blockchain Records (3 minutes)

#### Query Blockchain Directly:

```bash
# Get version history from blockchain
curl http://localhost:3000/getGradeVersionHistory/result_1

# Should return complete history with:
# - currentGrade: {...}
# - versionHistory: [
#     {versionNumber: 1, transactionType: "CREATE", ...},
#     {versionNumber: 2, transactionType: "UPDATE", ...}
#   ]
# - totalVersions: 2
# - totalUpdates: 1
```

#### Verify Audit Trail Exists:

```bash
# Query blockchain for audit records
curl http://localhost:3000/getGradeAudit/result_1

# Should return audit records:
# [
#   {
#     "transactionType": "CREATE",
#     "transactionId": "txn_abc123",
#     "timestamp": "2025-11-15T10:30:00Z",
#     "performer": "CN=lecturer1,...",
#     "hash": "ABC123..."
#   },
#   {
#     "transactionType": "UPDATE",
#     "transactionId": "txn_def456",
#     "timestamp": "2025-11-20T14:45:00Z",
#     "performer": "CN=lecturer1,...",
#     "previousHash": "ABC123...",
#     "oldValues": {...},
#     "newValues": {...}
#   }
# ]
```

**✅ Checkpoint:** All transactions permanently recorded in blockchain

---

## 🎉 Success Criteria

You've successfully tested the system if:

- ✅ Grade submitted to blockchain (visible in logs)
- ✅ Grade updated with blockchain transaction
- ✅ Version history shows both CREATE and UPDATE
- ✅ Side-by-side comparison displays changes
- ✅ Integrity verification passes (hashes match)
- ✅ OFFICIAL grades cannot be edited
- ✅ Blockchain records queryable directly
- ✅ Audit trail complete and immutable

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to blockchain service"

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Solution:**
1. Check Node.js gateway is running
2. Verify port 3000 is available
3. Check Fabric network is up: `docker ps`
4. Should see containers: peer0, orderer, ca

---

### Issue: "Grade update returns fake transaction"

**Symptoms:**
```
transactionId: "UPDATE-123-1234567890"
message: "Grade updated (mock)"
```

**Cause:** Update not reaching blockchain (old bug)

**Solution:**
1. Verify Node.js has `/updateGrade` endpoint
2. Check chaincode has `updateGrade` method
3. Ensure `MockBlockchainService.update_course_result()` uses `PUT` not `POST`
4. Restart Node.js gateway

---

### Issue: "Version history empty"

**Symptoms:**
```
versionHistory: []
totalVersions: 0
```

**Possible Causes:**
1. Blockchain not storing audit records
2. Wrong result_id format
3. Chaincode not deployed

**Solution:**
1. Check chaincode deployed: `docker logs peer0.org1.example.com`
2. Verify result_id format: `result_{enrollmentId}`
3. Test direct blockchain query: `curl http://localhost:3000/getGradeVersionHistory/result_1`

---

### Issue: "Hash mismatch detected"

**Symptoms:**
```
isValid: false
status: "TAMPERED"
databaseHash != blockchainHash
```

**This is GOOD - it means tampering detection works!**

**Solution:**
1. Check if database was manually modified
2. Verify blockchain is source of truth
3. Restore from blockchain if needed
4. Investigate who/when tampering occurred

---

## 📊 Expected Test Results

### Performance Benchmarks (Local Dev)

| Operation | Expected Time | Acceptable Range |
|-----------|---------------|------------------|
| Grade Submit | 200-300ms | < 500ms |
| Grade Update | 200-300ms | < 500ms |
| Version History | 100-150ms | < 300ms |
| Integrity Check | 50-100ms | < 200ms |

### Blockchain Verification

```bash
# Check blockchain has records
docker exec peer0.org1.example.com peer chaincode query \
  -C mychannel \
  -n basic \
  -c '{"Args":["getGradeVersionHistory","result_1"]}'

# Should return JSON with version history
```

---

## 🔍 Deep Dive: What Happens Behind the Scenes

### Grade Update Flow

```
1. Frontend: User clicks "Update Grade"
   ↓
2. Frontend: PUT /api/srs-domain/course-results/123
   ↓
3. Django: update_course_result() function
   - Validates authorization
   - Checks grade is PENDING
   - Captures old values
   ↓
4. Django: blockchain.update_course_result(result_id, data)
   ↓
5. Node.js: PUT /updateGrade/result_1
   ↓
6. Node.js: contract.submitTransaction('updateGrade', result_id, data)
   ↓
7. Fabric: Endorsement phase
   - Peers validate transaction
   - Execute chaincode
   - Return proposal response
   ↓
8. Fabric: Ordering phase
   - Orderer sequences transactions
   - Creates block
   ↓
9. Fabric: Commit phase
   - Peers commit block to ledger
   - Update world state
   ↓
10. Chaincode: courseResult.update()
    - Store old values in audit trail
    - Update grade record
    - Recompute hash
    - Link previous version
    ↓
11. Node.js: Return transaction result
    ↓
12. Django: Update database
    - New hash
    - New transaction ID
    - Reset verification status
    ↓
13. Frontend: Show success message
```

---

## 📝 Test Report Template

```markdown
# Secured SRS POC Test Report

**Date:** [Your test date]
**Tester:** [Your name]
**Duration:** [Time taken]

## Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| Grade Submission | ✅ Pass | Transaction ID: txn_abc123 |
| Grade Update | ✅ Pass | Hash changed: ABC → DEF |
| Version History | ✅ Pass | 2 versions displayed |
| Integrity Verification | ✅ Pass | Hashes match |
| Immutability | ✅ Pass | OFFICIAL grades locked |

## Blockchain Verification

- ✅ Transactions visible in blockchain
- ✅ Audit trail complete
- ✅ Hashes linked correctly
- ✅ No data loss

## Performance

- Grade Submit: 250ms
- Grade Update: 280ms
- Version History: 120ms
- Integrity Check: 80ms

## Issues Found

[List any issues]

## Conclusion

[Your assessment]
```

---

## 🎓 Next Steps

After successful testing:

1. ✅ Document your findings
2. ✅ Demo to stakeholders
3. ✅ Plan multi-org deployment
4. ✅ Set up monitoring
5. ✅ Prepare for production

---

**Happy Testing!** 🚀

If you encounter any issues not covered here, check the main POC documentation or contact the development team.

---

**Last Updated:** December 3, 2025
**Document Version:** 1.0
**Tested With:** Hyperledger Fabric 2.x, Django 3.x, React 18.x
