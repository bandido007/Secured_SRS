# SRS Domain Layer - API Testing Guide (Updated)

## Overview

This guide provides accurate examples for testing the SRS Domain Layer APIs with the new service architecture.

**Base URL**: `http://localhost:8000/api/domain`

**Authentication**: All endpoints require Bearer token authentication.

---

## Table of Contents
1. [Authentication](#authentication)
2. [Student Endpoints](#student-endpoints)
3. [Lecturer Endpoints](#lecturer-endpoints)
4. [Course Endpoints](#course-endpoints)
5. [Enrollment Endpoints](#enrollment-endpoints)
6. [Grade/Course Results Endpoints](#grade-course-results-endpoints)
7. [Transcript Endpoints](#transcript-endpoints)
8. [Complete Testing Flow](#complete-testing-flow)

---

## Authentication

### Login to Get Access Token

```http
POST http://localhost:8000/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "expires": 86400,
  "user": {
    "id": "1",
    "userName": "admin",
    "email": "admin@example.com"
  }
}
```

### Use Token in All Requests

```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

---

## Student Endpoints

### 1. Create Student

**Important**: You must create a User account FIRST, then create the Student profile.

#### Step 1: Register User Account
```http
POST http://localhost:8000/api/accounts/register
Content-Type: application/json

{
  "username": "john.doe",
  "email": "john.doe@university.edu",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "response": {
    "id": 1,
    "status": true,
    "message": "Account created successfully",
    "code": 200
  }
}
```

#### Step 2: Get User ID
```http
POST http://localhost:8000/api/auth/login
Content-Type: application/json

{
  "username": "john.doe",
  "password": "SecurePass123!"
}
```

Note the `user.id` from the response (e.g., "5").

#### Step 3: Create Student Profile
```http
POST http://localhost:8000/api/domain/students
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": 5,
  "studentId": "STU2024001",
  "program": "BSc Computer Science",
  "yearOfStudy": 1,
  "enrollmentDate": "2024-09-01",
  "enrollmentStatus": "ACTIVE",
  "phoneNumber": "+1234567890",
  "dateOfBirth": "2003-08-20"
}
```

**Response:**
```json
{
  "response": {
    "id": 1,
    "status": true,
    "message": "Student created successfully",
    "code": 200
  }
}
```

**Required Permission**: `manage_student_records`

---

### 2. List All Students

```http
GET http://localhost:8000/api/domain/students?pageNumber=1&itemsPerPage=10
Authorization: Bearer <token>
```

**Query Parameters**:
- `pageNumber` - Page number (default: 1)
- `itemsPerPage` - Items per page (default: 10)
- `program` - Filter by program
- `yearOfStudy` - Filter by year (1-10)
- `enrollmentStatus` - Filter by status (ACTIVE, GRADUATED, SUSPENDED, WITHDRAWN)
- `searchTerm` - Search across all text fields

**Response:**
```json
{
  "response": {
    "id": 1,
    "status": true,
    "message": "Success",
    "code": 200
  },
  "page": {
    "number": 10,
    "hasNextPage": false,
    "hasPreviousPage": false,
    "currentPageNumber": 1,
    "nextPageNumber": null,
    "previousPageNumber": null,
    "numberOfPages": 1,
    "totalElements": 1,
    "pagesNumberArray": [1]
  },
  "data": [
    {
      "id": 1,
      "uniqueId": "123e4567-e89b-12d3-a456-426614174000",
      "createdDate": "2024-01-15",
      "updatedDate": "2024-01-15",
      "isActive": true,
      "studentId": "STU2024001",
      "userId": 5,
      "username": "john.doe",
      "email": "john.doe@university.edu",
      "program": "BSc Computer Science",
      "yearOfStudy": 1,
      "enrollmentDate": "2024-09-01",
      "enrollmentStatus": "ACTIVE",
      "phoneNumber": "+1234567890",
      "dateOfBirth": "2003-08-20"
    }
  ]
}
```

**Required Permission**: `view_all_students`

---

### 3. Get Specific Student

```http
GET http://localhost:8000/api/domain/students/1
Authorization: Bearer <token>
```

**Required Permission**: `view_own_records` OR `view_all_students`

**Business Rule**: Students can only view their own records unless they have admin permissions.

---

### 4. Update Student

```http
PUT http://localhost:8000/api/domain/students/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": 5,
  "studentId": "STU2024001",
  "program": "BSc Software Engineering",
  "yearOfStudy": 2,
  "enrollmentDate": "2024-09-01",
  "enrollmentStatus": "ACTIVE",
  "phoneNumber": "+1234567890",
  "dateOfBirth": "2003-08-20"
}
```

**Required Permission**: `manage_student_records`

---

### 5. Deactivate Student (Soft Delete)

```http
DELETE http://localhost:8000/api/domain/students/1
Authorization: Bearer <token>
```

Sets `is_active=False` and `enrollment_status='WITHDRAWN'`.

**Required Permission**: `manage_student_records`

---

## Lecturer Endpoints

### 1. Create Lecturer

#### Step 1: Create User Account
```http
POST http://localhost:8000/api/accounts/register
Content-Type: application/json

{
  "username": "dr.smith",
  "email": "dr.smith@university.edu",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

#### Step 2: Create Lecturer Profile
```http
POST http://localhost:8000/api/domain/lecturers
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": 6,
  "lecturerId": "LEC001",
  "department": "Computer Science",
  "specialization": "Artificial Intelligence"
}
```

**Required Permission**: `manage_lecturer_accounts`

---

### 2. List All Lecturers

```http
GET http://localhost:8000/api/domain/lecturers
Authorization: Bearer <token>
```

**Query Parameters**:
- `department` - Filter by department
- `specialization` - Filter by specialization

**Required Permission**: `view_lecturer_information`

---

### 3. Update Lecturer

```http
PUT http://localhost:8000/api/domain/lecturers/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": 6,
  "lecturerId": "LEC001",
  "department": "Computer Science",
  "specialization": "Machine Learning"
}
```

**Required Permission**: `manage_lecturer_accounts`

---

### 4. Deactivate Lecturer

```http
DELETE http://localhost:8000/api/domain/lecturers/1
Authorization: Bearer <token>
```

**Required Permission**: `manage_lecturer_accounts`

---

## Course Endpoints

### 1. Create Course (with Decimal Credits)

```http
POST http://localhost:8000/api/domain/courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseCode": "CS101",
  "courseName": "Introduction to Programming",
  "credits": 7.5,
  "department": "Computer Science",
  "assignedLecturerId": 1,
  "description": "Fundamentals of programming using Python"
}
```

**Credits Examples**: 7.5, 9.0, 9.5, 10.0 (supports decimal values)

**Required Permission**: `manage_course_catalog`

---

### 2. List All Courses

```http
GET http://localhost:8000/api/domain/courses?minCredits=7.5&maxCredits=10.0
Authorization: Bearer <token>
```

**Query Parameters**:
- `department` - Filter by department
- `assignedLecturerId` - Filter by lecturer
- `minCredits` - Minimum credits (e.g., 7.5)
- `maxCredits` - Maximum credits (e.g., 10.0)

**Required Permission**: `view_course_catalog`

---

### 3. Update Course

```http
PUT http://localhost:8000/api/domain/courses/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseCode": "CS101",
  "courseName": "Introduction to Programming with Python",
  "credits": 9.0,
  "department": "Computer Science",
  "assignedLecturerId": 1,
  "description": "Updated description"
}
```

**Required Permission**: `manage_course_catalog`

---

### 4. Deactivate Course

```http
DELETE http://localhost:8000/api/domain/courses/1
Authorization: Bearer <token>
```

**Required Permission**: `manage_course_catalog`

---

## Enrollment Endpoints

### 1. Create Enrollment

```http
POST http://localhost:8000/api/domain/enrollments
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentId": 1,
  "courseId": 1,
  "semester": "FALL",
  "academicYear": "2024-2025",
  "lecturerId": 1
}
```

**Semester Options**: FALL, SPRING, SUMMER

**Business Rules**:
- Student must be ACTIVE
- Course must be active
- No duplicate enrollments (unique: student + course + semester + academic_year)

**Required Permission**: `manage_enrollment`

---

### 2. List Enrollments

```http
GET http://localhost:8000/api/domain/enrollments?studentId=1&semester=FALL
Authorization: Bearer <token>
```

**Query Parameters**:
- `studentId` - Filter by student
- `courseId` - Filter by course
- `semester` - Filter by semester
- `academicYear` - Filter by academic year
- `lecturerId` - Filter by lecturer

**Required Permission**: `view_enrollment_records`

---

### 3. Withdraw from Course

```http
DELETE http://localhost:8000/api/domain/enrollments/1
Authorization: Bearer <token>
```

**Required Permission**: `manage_enrollment`

---

## Grade (Course Results) Endpoints

### THE CORE OPERATIONS - Using New Service Architecture

### Prerequisites: Lecturer Profile Required

**IMPORTANT**: Only users with a **Lecturer profile** can submit grades. If you don't have one:

```http
POST http://localhost:8000/api/domain/lecturers
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "userId": <your_user_id>,
  "lecturerId": "LECT_YOUR_ID",
  "department": "Your Department",
  "specialization": "Your Area"
}
```

---

### 1. Submit Grade

**IMPORTANT**: You must be logged in as a user with a **Lecturer profile** to submit grades.
```http
POST http://localhost:8000/api/domain/course-results
Authorization: Bearer <lecturer_token>
Content-Type: application/json

{
  "enrollmentId": 1,
  "gradeType": "NUMERIC",
  "numericGrade": 85.5,
  "letterGrade": null,
  "courseWorkGrade": 40.0,
  "examGrade": 45.5,
  "remarks": "Pass",
  "comments": "Excellent performance in the final exam"
},
```

**Note**: The `submittedById` field is **NOT required** - the system automatically extracts the lecturer from your logged-in user account.

**What Happens (via AcademicRecordService)**:
1. ✅ Validates lecturer authorization
2. ✅ Validates enrollment exists
3. ✅ Checks for duplicate grades
4. ✅ Validates grade values
5. ✅ Creates grade record (status: PENDING)
6. ✅ Computes cryptographic hash (via CryptographyService)
7. ✅ Stores transaction on blockchain (via BlockchainService)
8. ✅ Stores data in IPFS (via StorageService)
9. ✅ Creates RecordTransaction (audit trail)
10. ✅ Creates StorageReference

**Response:**
```json
{
  "response": {
    "id": 1,
    "status": true,
    "message": "Grade submitted successfully",
    "code": 200
  }
}
```

**Grade Types**:
- `NUMERIC`: Requires `numericGrade` (0-100)
- `LETTER`: Requires `letterGrade` (A, B+, C, etc.)

**Required Permission**: `submit_grades` (Lecturer only)

---

### Letter Grade Example

```http
POST http://localhost:8000/api/domain/course-results
Authorization: Bearer <lecturer_token>
Content-Type: application/json

{
  "enrollmentId": 2,
  "gradeType": "LETTER",
  "numericGrade": null,
  "letterGrade": "A",
  "courseWorkGrade": 45.0,
  "examGrade": 50.0,
  "remarks": "Distinction",
  "comments": "Outstanding work"
}
```

---

### 2. Verify Grade (Make Official & Immutable)

```http
POST http://localhost:8000/api/domain/course-results/1/verify
Authorization: Bearer <admin_token>
```

**What Happens (via AcademicRecordService)**:
1. ✅ Retrieves grade (must be PENDING)
2. ✅ Recomputes hash from grade data
3. ✅ Verifies hash matches stored hash (integrity check)
4. ✅ If valid: Sets status to OFFICIAL and `is_verified=True`
5. ✅ Sets `verified_at` timestamp
6. ✅ Creates VERIFY transaction in audit trail

**Once OFFICIAL, the grade is IMMUTABLE** - cannot be modified.

**Response (Success):**
```json
{
  "response": {
    "id": 1,
    "status": true,
    "message": "Grade verified and made official",
    "code": 200
  }
}
```

**Response (Integrity Failure):**
```json
{
  "response": {
    "id": 0,
    "status": false,
    "message": "Grade integrity check failed - hash mismatch",
    "code": 400
  }
}
```

**Required Permission**: `verify_grade_integrity`

---

### 3. List All Grades

```http
GET http://localhost:8000/api/domain/course-results?status=PENDING&semester=FALL
Authorization: Bearer <token>
```

**Query Parameters**:
- `enrollmentId` - Filter by enrollment
- `studentId` - Filter by student
- `courseId` - Filter by course
- `semester` - Filter by semester
- `academicYear` - Filter by academic year
- `status` - Filter by status (PENDING, OFFICIAL, DISPUTED)
- `submittedById` - Filter by lecturer who submitted
- `isVerified` - Filter by verification status (true/false)
- `gradeType` - Filter by grade type (NUMERIC, LETTER)

**Required Permission**: `view_grade_submissions`

---

### 4. Get Student's Grades

```http
GET http://localhost:8000/api/domain/students/1/grades?semester=FALL&academicYear=2024-2025
Authorization: Bearer <token>
```

**Business Rule**: Students can only view their own grades.

**Required Permission**: `view_own_records` OR `view_all_grade_submissions`

---

### 5. Get Grade Audit Trail

```http
GET http://localhost:8000/api/domain/course-results/1/audit-trail
Authorization: Bearer <token>
```

**Response:**
```json
{
  "response": {
    "id": 1,
    "status": true,
    "message": "Success",
    "code": 200
  },
  "data": [
    {
      "id": 1,
      "uniqueId": "uuid-1",
      "createdDate": "2024-01-15T10:30:00Z",
      "transactionType": "CREATE",
      "performedById": 1,
      "performerName": "Dr. Smith",
      "transactionId": "TX-1705318200.123-abc12345",
      "transactionHash": "abc123def456...",
      "gradeId": 1
    },
    {
      "id": 2,
      "uniqueId": "uuid-2",
      "createdDate": "2024-01-15T11:00:00Z",
      "transactionType": "VERIFY",
      "performedById": 2,
      "performerName": "Admin",
      "transactionId": "VERIFY-1-1705320000.456",
      "gradeId": 1
    }
  ]
}
```

**Transaction Types**:
- `CREATE` - Grade was submitted
- `VERIFY` - Grade was verified and made official
- `ACCESS` - Grade was accessed (if tracked)

**Required Permission**: `view_audit_trail`

---

## Transcript Endpoints

### 1. Generate Transcript

```http
POST http://localhost:8000/api/domain/transcripts/generate
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "studentId": 1,
  "academicYear": "2024-2025",
  "semester": "FALL",
  "isOfficial": true
}
```

**What Happens (via AcademicRecordService)**:
1. ✅ Gets all OFFICIAL grades for student
2. ✅ Filters by academic year/semester if specified
3. ✅ Calculates GPA (converts 0-100 to 4.0 scale)
4. ✅ Calculates total credits
5. ✅ Creates Merkle root hash of all grade hashes
6. ✅ Stores transcript data in IPFS
7. ✅ Creates AcademicTranscript record

**GPA Calculation**:
```
grade_point = numeric_grade / 25.0  # Convert 100 scale to 4.0 scale
gpa = sum(grade_point × credits) / sum(credits)
```

**Response:**
```json
{
  "response": {
    "id": 1,
    "status": true,
    "message": "Transcript generated successfully",
    "code": 200
  }
}
```

**Generate Full Year Transcript** (all semesters):
```json
{
  "studentId": 1,
  "academicYear": "2024-2025",
  "semester": null,
  "isOfficial": true
}
```

**Required Permission**: `generate_transcripts`

**Business Rule**: Only OFFICIAL grades are included in transcripts.

---

### 2. Get Student Transcripts

```http
GET http://localhost:8000/api/domain/students/1/transcripts?academicYear=2024-2025&isOfficial=true
Authorization: Bearer <token>
```

**Query Parameters**:
- `academicYear` - Filter by year
- `semester` - Filter by semester
- `isOfficial` - Filter by official status (true/false)

**Response:**
```json
{
  "response": {
    "id": 1,
    "status": true,
    "message": "Success",
    "code": 200
  },
  "data": [
    {
      "id": 1,
      "uniqueId": "transcript-uuid",
      "studentId": 1,
      "studentName": "John Doe",
      "studentNumber": "STU2024001",
      "academicYear": "2024-2025",
      "semester": "FALL",
      "gpa": 3.42,
      "totalCredits": 30.0,
      "blockchainRootHash": "merkle-root-abc123...",
      "ipfsCid": "QM-TRANSCRIPT-1-1705318200",
      "generatedAt": "2024-01-15T12:00:00Z",
      "isOfficial": true
    }
  ]
}
```

**Required Permission**: `view_own_records` OR `view_all_transcripts`

**Business Rule**: Students can only view their own transcripts.

---

## Complete Testing Flow

### End-to-End Workflow (10 Steps)

#### 1. Login as Admin
```bash
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}
# Save access token
```

#### 2. Create User Account for Student
```bash
POST /api/accounts/register
{
  "username": "john.doe",
  "email": "john.doe@university.edu",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
# Note: User ID will be returned after login
```

#### 3. Create Student Profile
```bash
POST /api/domain/students
{
  "userId": 5,
  "studentId": "STU2024001",
  "program": "BSc Computer Science",
  "yearOfStudy": 1,
  "enrollmentDate": "2024-09-01",
  "enrollmentStatus": "ACTIVE"
}
```

#### 4. Create Lecturer Profile
```bash
# First create user account, then:
POST /api/domain/lecturers
{
  "userId": 6,
  "lecturerId": "LEC001",
  "department": "Computer Science",
  "specialization": "Artificial Intelligence"
}
```

#### 5. Create Course
```bash
POST /api/domain/courses
{
  "courseCode": "CS101",
  "courseName": "Introduction to Programming",
  "credits": 7.5,
  "department": "Computer Science",
  "assignedLecturerId": 1
}
```

#### 6. Enroll Student in Course
```bash
POST /api/domain/enrollments
{
  "studentId": 1,
  "courseId": 1,
  "semester": "FALL",
  "academicYear": "2024-2025",
  "lecturerId": 1
}
```

#### 7. Submit Grade (Login as Lecturer)
```bash
# Login as lecturer first
POST /api/auth/login
{
  "username": "dr.smith",
  "password": "SecurePass123!"
}

# Submit grade
POST /api/domain/course-results
{
  "enrollmentId": 1,
  "gradeType": "NUMERIC",
  "numericGrade": 85.5,
  "courseWorkGrade": 40.0,
  "examGrade": 45.5,
  "remarks": "Pass",
  "submittedById": 1
}
```

#### 8. Verify Grade (Login as Admin)
```bash
POST /api/domain/course-results/1/verify
```

#### 9. View Audit Trail
```bash
GET /api/domain/course-results/1/audit-trail
```

#### 10. Generate Transcript
```bash
POST /api/domain/transcripts/generate
{
  "studentId": 1,
  "academicYear": "2024-2025",
  "semester": "FALL",
  "isOfficial": true
}
```

#### 11. View Transcript
```bash
GET /api/domain/students/1/transcripts
```

---

## Service Architecture Benefits

### What Happens Behind the Scenes

When you call `POST /api/domain/course-results`, the new architecture:

1. **View Layer** (HTTP handling):
   - Extracts data from HTTP request
   - Calls `AcademicRecordService.submit_grade()`
   - Returns HTTP response

2. **Service Layer** (Business logic):
   - `AcademicRecordService.submit_grade()` orchestrates:
     - Validates lecturer
     - Validates enrollment
     - Checks duplicates
     - Creates grade record
     - Calls `CryptographyService.compute_hash()`
     - Calls `BlockchainService.store_transaction()`
     - Calls `StorageService.store_content()`
     - Creates audit trail

3. **Infrastructure Services** (Currently mocks):
   - `MockCryptographyService`: Real SHA-256 hashing
   - `MockBlockchainService`: In-memory transaction storage
   - `MockStorageService`: In-memory content storage

**Later**, you can swap mocks for real services without changing the API!

---

## Common Errors

### 400 - Student ID Already Exists
```json
{
  "response": {
    "id": 0,
    "status": false,
    "message": "Student ID already exists",
    "code": 400
  }
}
```

### 400 - Grade Already Exists
```json
{
  "response": {
    "id": 0,
    "status": false,
    "message": "Grade already exists for this enrollment",
    "code": 400
  }
}
```

### 400 - Cannot Verify Official Grade
```json
{
  "response": {
    "id": 0,
    "status": false,
    "message": "Cannot verify grade with status OFFICIAL",
    "code": 400
  }
}
```

### 403 - Permission Denied
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 - Not Found
```json
{
  "response": {
    "id": 0,
    "status": false,
    "message": "Not found",
    "code": 404
  }
}
```

---

## Testing Checklist

### Student Operations
- [ ] Create user account
- [ ] Create student profile with valid user ID
- [ ] List all students with pagination
- [ ] Filter students by program
- [ ] Get specific student (own record)
- [ ] Update student information
- [ ] Deactivate student
- [ ] Try to create duplicate student_id (should fail)

### Lecturer Operations
- [ ] Create lecturer profile
- [ ] List all lecturers
- [ ] Filter by department
- [ ] Update lecturer specialization
- [ ] Deactivate lecturer

### Course Operations
- [ ] Create course with decimal credits (7.5)
- [ ] Create course with integer credits (9.0)
- [ ] List courses
- [ ] Filter by credit range (7.5-10.0)
- [ ] Update course
- [ ] Deactivate course
- [ ] Try to create duplicate course code (should fail)

### Enrollment Operations
- [ ] Create enrollment
- [ ] List enrollments by student
- [ ] List enrollments by course
- [ ] Withdraw from course
- [ ] Try to create duplicate enrollment (should fail)

### Grade Operations (Service Architecture)
- [ ] Submit numeric grade (lecturer)
- [ ] Submit letter grade (lecturer)
- [ ] Verify grade (admin) - becomes OFFICIAL
- [ ] Try to verify already official grade (should fail)
- [ ] Try to submit grade without enrollment (should fail)
- [ ] View student's own grades
- [ ] View audit trail

### Transcript Operations (Service Architecture)
- [ ] Generate semester transcript
- [ ] Generate full year transcript
- [ ] View own transcripts (student)
- [ ] Generate transcript with no official grades (should handle gracefully)

---

## Notes

1. **User Creation**: Always create User account FIRST via `/api/accounts/register`, then create Student/Lecturer profile
2. **Decimal Credits**: Supports 7.5, 9.0, 9.5, 10.0 for real university credit systems
3. **Grade Immutability**: Once OFFICIAL, grades cannot be modified
4. **Service Architecture**: Grade operations now use `AcademicRecordService` for clean separation
5. **Audit Trail**: Every grade operation (CREATE, VERIFY) is logged
6. **GPA Calculation**: Simple 4.0 scale conversion (100/25 = 4.0)

---

## Server Start

```bash
# Activate virtual environment
source venv/bin/activate

# Run server
python manage.py runserver

# API available at: http://localhost:8000/api/domain/
# API docs at: http://localhost:8000/api/docs
```

---

## Support

For issues:
- Check logs in `logs/srs.log`
- Verify permissions are assigned correctly
- Check audit trail for transaction history
- Review service architecture in `SRS_SERVICE_ARCHITECTURE.md`
