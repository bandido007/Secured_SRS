# Secured SRS - System Architecture Diagram

## Complete System Overview

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                        USER INTERFACE LAYER                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│   Lecturer    │         │    Admin      │         │   Student     │
│   Dashboard   │         │   Dashboard   │         │   Portal      │
├───────────────┤         ├───────────────┤         ├───────────────┤
│ • Submit      │         │ • Verify      │         │ • View Grades │
│ • Update ✨   │         │ • Override    │         │ • View        │
│ • View        │         │ • Audit       │         │   History ✨  │
│   History ✨  │         │ • Reports     │         │ • Verify ✨   │
└───────┬───────┘         └───────┬───────┘         └───────┬───────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                    REST API (HTTP/HTTPS)
                                  │
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┷━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    DJANGO BACKEND (Python)                         ┃
┃                   Business Logic & Auth Layer                      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐       ┌───────────────┐
│ Authorization │         │  API Router   │       │   Database    │
│   Service     │         │  (Views.py)   │       │  PostgreSQL   │
├───────────────┤         ├───────────────┤       ├───────────────┤
│ • Permissions │         │ • Submit      │       │ • Students    │
│ • Roles       │         │ • Update ✨   │       │ • Courses     │
│ • Identity    │         │ • Version     │       │ • Grades      │
│               │         │   History ✨  │       │ • Audit Trail │
│               │         │ • Verify ✨   │       │   (Cache)     │
└───────────────┘         └───────┬───────┘       └───────────────┘
                                  │
                    MockBlockchainService
                    (HTTP Client - Fixed! ✨)
                                  │
                         HTTP REST (Port 3000)
                                  │
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┷━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃            NODE.JS FABRIC GATEWAY SERVER                           ┃
┃         (Hyperledger Fabric SDK Integration)                       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐       ┌───────────────┐
│   Identity    │         │   Gateway     │       │   Endpoints   │
│  Management   │         │   (Fabric SDK)│       │   (Express)   │
├───────────────┤         ├───────────────┤       ├───────────────┤
│ • Fabric CA   │         │ • Connect     │       │ POST /submit  │
│ • Wallets     │         │ • Invoke      │       │ PUT  /update✨│
│ • Enrollment  │         │ • Query       │       │ GET  /history✨│
│ • Cert Mgmt   │         │ • Events      │       │ GET  /verify✨│
└───────────────┘         └───────┬───────┘       └───────────────┘
                                  │
                          Fabric gRPC Protocol
                                  │
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┷━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃              HYPERLEDGER FABRIC BLOCKCHAIN NETWORK                 ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐       ┌───────────────┐
│   Peer 0      │         │   Peer 1      │       │   Orderer     │
│   Org1MSP     │         │   Org1MSP     │       │   Service     │
├───────────────┤         ├───────────────┤       ├───────────────┤
│ • Endorse     │         │ • Endorse     │       │ • Order Txns  │
│ • Validate    │         │ • Validate    │       │ • Create      │
│ • Commit      │         │ • Commit      │       │   Blocks      │
│ • Query       │         │ • Query       │       │ • Distribute  │
└───────┬───────┘         └───────┬───────┘       └───────┬───────┘
        │                         │                       │
        └─────────────────────────┼───────────────────────┘
                                  │
                                  ▼
        ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
        ┃         CHAINCODE (Smart Contracts)           ┃
        ┃         courseResult.js ✨ ENHANCED           ┃
        ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐       ┌───────────────┐
│  submit()     │         │  update() ✨  │       │  verify()     │
├───────────────┤         ├───────────────┤       ├───────────────┤
│ • Create new  │         │ • Store old   │       │ • Mark as     │
│   grade       │         │   version     │       │   OFFICIAL    │
│ • Compute     │         │ • Link prev   │       │ • Lock from   │
│   hash        │         │   hash        │       │   updates     │
│ • Store in    │         │ • Recompute   │       │ • Finalize    │
│   ledger      │         │   hash        │       │               │
└───────────────┘         └───────────────┘       └───────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐       ┌───────────────┐
│getVersion     │         │verifyIntegrity│       │ getAuditTrail │
│History() ✨   │         │    () ✨      │       │      ()       │
├───────────────┤         ├───────────────┤       ├───────────────┤
│ • Get all     │         │ • Recompute   │       │ • Get all     │
│   versions    │         │   hash        │       │   audit       │
│ • Show        │         │ • Compare     │       │   records     │
│   changes     │         │ • Detect      │       │ • Filter by   │
│ • Link chain  │         │   tampering   │       │   type        │
└───────────────┘         └───────────────┘       └───────────────┘
                                  │
                                  ▼
        ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
        ┃         BLOCKCHAIN LEDGER (Immutable)         ┃
        ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐       ┌───────────────┐
│   World State │         │   Blockchain  │       │  Audit Trail  │
│   (Current)   │         │   (History)   │       │   (Events)    │
├───────────────┤         ├───────────────┤       ├───────────────┤
│ result_1:     │         │ Block #1:     │       │ audit_1_v1:   │
│ {             │         │ - TX-001      │       │ - CREATE      │
│   grade: 85   │         │ - Hash: ABC   │       │ - timestamp   │
│   hash: DEF   │         │               │       │               │
│   status: P   │         │ Block #2:     │       │ audit_1_v2:   │
│   prev: ABC   │         │ - TX-002      │       │ - UPDATE      │
│ }             │         │ - Hash: DEF   │       │ - oldValues   │
│               │         │ - Prev: ABC   │       │ - newValues   │
│               │         │               │       │ - changes     │
└───────────────┘         └───────────────┘       └───────────────┘

✨ = New/Enhanced Feature in POC Implementation
```

---

## Data Flow: Grade Update

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GRADE UPDATE FLOW                                │
└─────────────────────────────────────────────────────────────────────┘

1. LECTURER INITIATES UPDATE
   └─> Frontend: Click "Edit" button
       └─> Modal opens with current values
           └─> User changes grade: 65 → 85
               └─> Clicks "Update Grade"

2. FRONTEND VALIDATION
   └─> Check: All required fields filled?
       └─> Check: Valid grade range (0-100)?
           └─> Prepare API request
               └─> PUT /api/srs-domain/course-results/123

3. DJANGO BACKEND PROCESSING
   └─> Authenticate user (JWT token)
       └─> Check permissions (submit_grades, update_grades)
           └─> Validate: User is original submitter?
               └─> Validate: Grade status is PENDING?
                   └─> Capture old values {grade: 65, ...}
                       └─> Prepare blockchain data
                           └─> Call: blockchain.update_course_result()

4. NODE.JS GATEWAY
   └─> Receive: PUT /updateGrade/result_1
       └─> Get Fabric connection
           └─> Select identity (lecturer1)
               └─> Invoke: contract.submitTransaction('updateGrade', ...)
                   └─> Wait for endorsement

5. FABRIC ENDORSEMENT PHASE
   └─> Peer0 receives proposal
       └─> Execute chaincode simulation
           └─> courseResult.update() runs
               ├─> Check: status === 'OFFICIAL'? → Reject!
               ├─> Store audit: audit_result_1_1701619200
               │   └─> Contains: oldValues, newValues, changes
               ├─> Update grade record
               │   └─> New hash: DEF456
               │   └─> Previous hash: ABC123
               └─> Return proposal response
                   └─> {transactionId, newHash, previousHash}

6. FABRIC ORDERING PHASE
   └─> Orderer receives endorsed transaction
       └─> Sequence transactions
           └─> Create block
               └─> Block #142: Contains TX-002
                   └─> Distribute to peers

7. FABRIC COMMIT PHASE
   └─> Peer0 receives block
       └─> Validate block
           └─> Commit to ledger
               ├─> Update world state: result_1.hash = DEF456
               ├─> Add audit record: audit_result_1_1701619200
               └─> Emit commit event

8. NODE.JS RESPONSE
   └─> Transaction confirmed
       └─> Return to Django:
           {
             "message": "Grade updated successfully",
             "transactionId": "TX-002",
             "previousHash": "ABC123...",
             "newHash": "DEF456...",
             "changesCount": 3
           }

9. DJANGO POST-PROCESSING
   └─> Update database
       ├─> grade.blockchain_hash = "DEF456..."
       ├─> grade.blockchain_transaction_id = "TX-002"
       ├─> grade.is_verified = False (reset)
       └─> grade.status = 'PENDING'
           └─> Create RecordTransaction
               └─> Save metadata for quick lookup

10. FRONTEND UPDATE
    └─> Receive success response
        └─> Show success message
            └─> Refresh grade list
                └─> Grade now shows: 85 (PENDING)
                    └─> "Edit" button still visible

TOTAL TIME: ~250-300ms
BLOCKCHAIN RECORDS: 2 (grade update + audit trail)
IMMUTABILITY: ✅ PRESERVED (both v1 and v2 in blockchain)
```

---

## Version History Retrieval

```
┌─────────────────────────────────────────────────────────────────────┐
│                 VERSION HISTORY RETRIEVAL FLOW                      │
└─────────────────────────────────────────────────────────────────────┘

1. USER CLICKS "VIEW HISTORY"
   └─> Navigate to: /grade-history/123

2. FRONTEND QUERY
   └─> GET /api/srs-domain/course-results/123/version-history

3. DJANGO PROCESSING
   └─> Get grade from database
       └─> Extract result_id = "result_1"
           └─> Call: blockchain.get_version_history(result_id)

4. NODE.JS GATEWAY
   └─> GET /getGradeVersionHistory/result_1
       └─> Invoke: contract.evaluateTransaction('getGradeVersionHistory', ...)

5. CHAINCODE EXECUTION
   └─> courseResult.getVersionHistory() runs
       ├─> Get current grade: result_1
       ├─> Find all audit records: audit_result_1_*
       ├─> Parse each audit record:
       │   └─> Extract: timestamp, type, performer, changes
       ├─> Sort by timestamp (oldest first)
       └─> Return:
           {
             currentGrade: {...},
             versionHistory: [v1, v2, v3, ...],
             totalVersions: 3
           }

6. DJANGO ENRICHMENT
   └─> Add metadata:
       ├─> Student name
       ├─> Course details
       ├─> Current status
       └─> Total updates count

7. FRONTEND DISPLAY
   └─> Render timeline:
       ┌────────────────────────────────┐
       │ v1 [CREATE] Nov 15, 10:30 AM  │
       │ Grade: 65                      │
       └────────────────────────────────┘
              │
       ┌────────────────────────────────┐
       │ v2 [UPDATE] Nov 20, 2:45 PM   │
       │ Grade: 65 → 85                 │
       │ Reason: Calculation error      │
       │ Changes: 3 fields              │
       └────────────────────────────────┘
              │
       ┌────────────────────────────────┐
       │ v3 [VERIFY] Nov 22, 9:00 AM   │
       │ Status: OFFICIAL               │
       └────────────────────────────────┘

TOTAL TIME: ~100-150ms
DATA SOURCE: 100% Blockchain
IMMUTABILITY: ✅ VERIFIED
```

---

## Integrity Verification

```
┌─────────────────────────────────────────────────────────────────────┐
│                 INTEGRITY VERIFICATION FLOW                         │
└─────────────────────────────────────────────────────────────────────┘

1. TRIGGER (Multiple Ways)
   ├─> Manual: User clicks "Verify Integrity"
   ├─> Automatic: Before displaying grade
   └─> Scheduled: Periodic cron job

2. FRONTEND/BACKEND REQUEST
   └─> GET /api/srs-domain/course-results/123/verify-integrity

3. DJANGO PROCESSING
   └─> Get grade from database
       ├─> Extract: database_hash = "DEF456..."
       └─> Call: blockchain.verify_grade_integrity(result_id)

4. NODE.JS GATEWAY
   └─> GET /verifyGradeIntegrity/result_1

5. CHAINCODE EXECUTION
   └─> courseResult.verifyIntegrity() runs
       ├─> Get grade from blockchain
       │   └─> stored_hash = "DEF456..."
       ├─> Recompute hash from current data
       │   └─> computed_hash = hash({enrollmentId, grade, ...})
       └─> Compare hashes:
           ├─> stored_hash === computed_hash?
           │   ├─> YES → Return: {isValid: true, status: "VERIFIED"}
           │   └─> NO  → Return: {isValid: false, status: "TAMPERED"}

6. DJANGO COMPARISON
   └─> Compare: database_hash vs blockchain_hash
       ├─> Match → ✅ "Integrity verified"
       └─> Mismatch → 🚨 "TAMPERING DETECTED"

7. FRONTEND DISPLAY
   └─> Show verification result:

       ✅ VERIFIED
       ┌────────────────────────────────┐
       │ Database Hash: DEF456...       │
       │ Blockchain Hash: DEF456...     │
       │ Computed Hash: DEF456...       │
       │ Status: All hashes match ✓     │
       │ Timestamp: 2025-12-03 15:30    │
       └────────────────────────────────┘

       OR

       🚨 TAMPERED
       ┌────────────────────────────────┐
       │ Database Hash: XYZ789...       │
       │ Blockchain Hash: DEF456...     │
       │ Computed Hash: DEF456...       │
       │ Status: HASH MISMATCH!         │
       │ ⚠️ Data may be compromised     │
       │ Action: Alert administrator    │
       └────────────────────────────────┘

TOTAL TIME: ~50-100ms
SECURITY LEVEL: Cryptographic (SHA-256)
TAMPERING DETECTION: Automatic
```

---

## Key Features Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                     FEATURE IMPLEMENTATION MAP                      │
└─────────────────────────────────────────────────────────────────────┘

FEATURE: Grade Submission
├─ Frontend: LecturerGradeSubmission.tsx
├─ Django: submit_course_result()
├─ Node.js: POST /submitGrade
└─ Chaincode: courseResult.submit()
   └─ Status: ✅ Working (Original)

FEATURE: Grade Update ✨ NEW
├─ Frontend: Edit modal in LecturerGradeSubmission.tsx
├─ Django: update_course_result()
├─ Node.js: PUT /updateGrade/:resultId
└─ Chaincode: courseResult.update()
   ├─ Stores old values in audit trail
   ├─ Recomputes hash
   └─ Links previous version
   └─ Status: ✅ Implemented

FEATURE: Version History ✨ NEW
├─ Frontend: GradeVersionHistoryPage.tsx
├─ Django: get_grade_version_history()
├─ Node.js: GET /getGradeVersionHistory/:resultId
└─ Chaincode: courseResult.getVersionHistory()
   ├─ Retrieves all audit records
   ├─ Sorts chronologically
   └─ Returns complete timeline
   └─ Status: ✅ Implemented

FEATURE: Integrity Verification ✨ NEW
├─ Frontend: Verify button + status badge
├─ Django: verify_grade_integrity()
├─ Node.js: GET /verifyGradeIntegrity/:resultId
└─ Chaincode: courseResult.verifyIntegrity()
   ├─ Recomputes hash
   ├─ Compares with stored
   └─ Detects tampering
   └─ Status: ✅ Implemented

FEATURE: Audit Trail
├─ Frontend: Audit tab (future)
├─ Django: RecordTransaction model
├─ Node.js: GET /getGradeAudit/:resultId
└─ Chaincode: courseResult.getAuditTrail()
   └─ Status: ✅ Working (Original)

FEATURE: Grade Verification (Make Official)
├─ Frontend: Admin approval button
├─ Django: verify_grade()
├─ Node.js: GET /verifyGrade/:resultId
└─ Chaincode: courseResult.verify()
   └─ Status: ✅ Working (Original)
```

---

## Security Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SECURITY & AUTHORIZATION                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  User Request   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Authentication  │  ← JWT Token Validation
├─────────────────┤
│ Valid token?    │
│  YES → Continue │
│  NO  → 401      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Authorization  │  ← Permission Check
├─────────────────┤
│ Has permission? │
│ • submit_grades │
│ • update_grades │
│  YES → Continue │
│  NO  → 403      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Ownership      │  ← Business Rule
├─────────────────┤
│ Is owner?       │
│  YES → Continue │
│  NO  → 403      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Status Check   │  ← Grade State
├─────────────────┤
│ PENDING?        │
│  YES → Continue │
│  NO  → 400      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Verification   │  ← Chaincode Rule
├─────────────────┤
│ Not verified?   │
│  YES → ALLOW    │
│  NO  → Reject   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Blockchain TX  │  ← Immutable Record
├─────────────────┤
│ • Store old val │
│ • Compute hash  │
│ • Link previous │
│ • Create audit  │
└─────────────────┘
```

---

## Legend

```
✨ = New/Enhanced Feature (POC Implementation)
✅ = Implemented and Working
⏳ = Pending Implementation
❌ = Not Implemented
🚨 = Critical/Security Feature
📊 = Performance Metric
🔐 = Security Control
```

---

**This architecture demonstrates a TRUE enterprise blockchain implementation!** 🚀
