// =============================================================
// Core Shared Types
// =============================================================

export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface UserRole {
  id: number;
  userId: number;
  roleId: number;
  roleName: 'ADMIN' | 'LECTURER' | 'STUDENT';
  permissions?: string[];
}

export type ProvisionRole = 'ADMIN' | 'STUDENT' | 'LECTURER';

export interface ProvisionStudentProfileInput {
  student_id: string;
  program: string;
  year_of_study: number;
  enrollment_date: string;
  enrollment_status?: string;
  phone_number?: string | null;
  date_of_birth?: string | null;
}

export interface ProvisionLecturerProfileInput {
  lecturer_id: string;
  department: string;
  specialization?: string | null;
}

export interface ProvisionUserPayload {
  username: string;
  email: string;
  password: string;
  role: ProvisionRole;
  first_name?: string | null;
  last_name?: string | null;
  student_profile?: ProvisionStudentProfileInput | null;
  lecturer_profile?: ProvisionLecturerProfileInput | null;
}

export interface ProvisionedUserData {
  userId: number;
  username: string;
  email: string;
  role: ProvisionRole;
  studentProfileId?: number;
  studentNumber?: string;
  lecturerProfileId?: number;
  lecturerCode?: string;
}

export interface AuthResponse {
  response: {
    status: boolean;
    message: string;
  };
  data?: {
    access: string;
    refresh: string;
    user: User;
    roles: UserRole[];
  };
}

export interface ResponseMeta {
  id: number;
  status: boolean;
  message: string;
  code: number;
}

export interface Pagination {
  number: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPageNumber: number;
  nextPageNumber?: number;
  previousPageNumber?: number;
  numberOfPages: number;
  totalElements: number;
  pagesNumberArray?: number[];
}

export interface ApiResponse<T = unknown> {
  response: ResponseMeta;
  data?: T;
}

export interface PagedResponse<T = unknown> {
  response: ResponseMeta;
  page?: Pagination;
  data?: T[];
}

// =============================================================
// Domain Models (match ninja serializer camelCase output)
// =============================================================

export interface Student {
  id: number;
  uniqueId: string;
  createdDate: string;
  updatedDate: string;
  isActive: boolean;
  studentId: string;
  userId: number;
  username: string;
  email: string;
  program: string;
  yearOfStudy: number;
  enrollmentDate: string;
  enrollmentStatus: string;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
}

export interface StudentInput {
  userId: number;
  studentId: string;
  program: string;
  yearOfStudy: number;
  enrollmentDate: string;
  enrollmentStatus?: string;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
}

export interface Lecturer {
  id: number;
  uniqueId: string;
  createdDate: string;
  updatedDate: string;
  isActive: boolean;
  lecturerId: string;
  userId: number;
  username: string;
  email: string;
  department: string;
  specialization?: string | null;
}

export interface LecturerInput {
  userId: number;
  lecturerId: string;
  department: string;
  specialization?: string | null;
}

export interface Course {
  id: number;
  uniqueId: string;
  createdDate: string;
  updatedDate: string;
  isActive: boolean;
  courseCode: string;
  courseName: string;
  credits: number;
  department: string;
  assignedLecturerId?: number | null;
  lecturerName?: string | null;
  description?: string | null;
}

export interface CourseInput {
  courseCode: string;
  courseName: string;
  credits: number;
  department: string;
  assignedLecturerId?: number | null;
  description?: string | null;
}

export interface Enrollment {
  id: number;
  uniqueId: string;
  createdDate: string;
  updatedDate: string;
  isActive: boolean;
  studentId: number;
  studentName: string;
  studentNumber: string;
  courseId: number;
  courseCode: string;
  courseName: string;
  semester: string;
  academicYear: string;
  lecturerId?: number | null;
  lecturerName?: string | null;
}

export interface EnrollmentInput {
  studentId: number;
  courseId: number;
  semester: string;
  academicYear: string;
  lecturerId?: number | null;
}

export type GradeStatus = 'PENDING' | 'OFFICIAL' | 'DISPUTED';
export type GradeType = 'NUMERIC' | 'LETTER' | 'PASS_FAIL';

export interface BlockchainData {
  "studentName": string;
  "studentNumber": string;
  "courseCode": string;
  "courseName": string;
  "submittedAt": string;
  "academicYear": string;
  "semester": string;
  "gradeType": string;
  "courseWorkGrade": string;
  "examGrade": string;
  "remarks": string | null;
  studentName: string;
  courseCode: string;
  academicYear: string;
  semester: string;
  gradeType: string;
  courseWorkGrade: string;
  examGrade?: string | null;
  remarks?: string | null;
}

export interface CourseResult {
  id: number;
  uniqueId: string;
  createdDate: string;
  updatedDate: string;
  isActive: boolean;
  enrollmentId: number;
  studentName: string;
  studentNumber: string;
  courseCode: string;
  courseName: string;
  semester: string;
  academicYear: string;
  gradeType: GradeType;
  numericGrade?: number | null;
  letterGrade?: string | null;
  courseWorkGrade?: number | null;
  examGrade?: number | null;
  remarks?: string | null;
  status: GradeStatus;
  submittedById: number;
  lecturerName: string;
  submittedAt: string;
  verifiedAt?: string | null;
  isVerified: boolean;
  blockchainHash?: string | null;
  blockchainTransactionId?: string | null;
  ipfsCid?: string | null;
  blockchainData?: BlockchainData | null;
}

export interface CourseResultInput {
  enrollmentId: number;
  gradeType: GradeType;
  numericGrade?: number | null;
  letterGrade?: string | null;
  courseWorkGrade?: number | null;
  examGrade?: number | null;
  remarks?: string | null;
  comments?: string | null;
}

export interface RecordTransaction {
  id: number;
  uniqueId: string;
  createdDate: string;
  updatedDate: string;
  isActive: boolean;
  gradeId: number;
  studentName: string;
  courseCode: string;
  transactionType: string;
  performedById: number;
  performerName: string;
  transactionId: string;
  transactionHash?: string | null;
  previousHash?: string | null;
}

export interface AcademicTranscript {
  id: number;
  uniqueId: string;
  createdDate: string;
  updatedDate: string;
  isActive: boolean;
  studentId: number;
  studentName: string;
  studentNumber: string;
  academicYear?: string | null;
  semester?: string | null;
  gpa?: number | null;
  totalCredits?: number | null;
  blockchainRootHash: string;
  ipfsCid: string;
  generatedAt?: string | null;
  isOfficial: boolean;
}

export interface TranscriptInput {
  studentId: number;
  academicYear?: string | null;
  semester?: string | null;
  isOfficial?: boolean;
}

export interface TranscriptGenerateResponse {
  response: ResponseMeta;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

// Filtering payloads (camelCase as expected by Ninja)
export interface PaginatedRequest {
  pageNumber?: number;
  itemsPerPage?: number;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: unknown;
}

export interface StudentFilters extends PaginatedRequest {
  program?: string;
  yearOfStudy?: number;
  enrollmentStatus?: string;
}

export interface LecturerFilters extends PaginatedRequest {
  department?: string;
  specialization?: string;
}

export interface CourseFilters extends PaginatedRequest {
  department?: string;
  assignedLecturerId?: number;
  minCredits?: number;
  maxCredits?: number;
}

export interface EnrollmentFilters extends PaginatedRequest {
  studentId?: number;
  courseId?: number;
  semester?: string;
  academicYear?: string;
  lecturerId?: number;
}

export interface CourseResultFilters extends PaginatedRequest {
  enrollmentId?: number;
  studentId?: number;
  courseId?: number;
  semester?: string;
  academicYear?: string;
  status?: GradeStatus;
  submittedById?: number;
  isVerified?: boolean;
  gradeType?: GradeType;
}

export interface TranscriptFilters extends PaginatedRequest {
  academicYear?: string;
  semester?: string;
  isOfficial?: boolean;
}

export interface AuditTrailFilters extends PaginatedRequest {
  transactionType?: string;
  performedById?: number;
}

// Grade Version History Types
export interface GradeChange {
  field: string;
  from: unknown;
  to: unknown;
}

export interface GradeVersionMetadata {
  updatedBy: string;
  updatedById: number;
  lecturerId?: number | null;
  lecturerCode?: string | null;
  updateReason?: string | null;
  oldValues: {
    gradeType: GradeType;
    numericGrade?: number | null;
    letterGrade?: string | null;
    courseWorkGrade?: number | null;
    examGrade?: number | null;
    remarks?: string | null;
    status: GradeStatus;
  };
  newValues: {
    gradeType: GradeType;
    numericGrade?: number | null;
    letterGrade?: string | null;
    courseWorkGrade?: number | null;
    examGrade?: number | null;
    remarks?: string | null;
    status: GradeStatus;
  };
  changes: GradeChange[];
}

export interface GradeVersion {
  versionNumber: number;
  transactionId: string;
  transactionType: 'CREATE' | 'UPDATE' | 'VERIFY' | 'ACCESS';
  timestamp: string;
  performedBy: {
    id: number | null;
    username: string;
    lecturerId?: string | null;
  };
  blockchainHash: string;
  previousHash?: string | null;
  changes?: {
    note: string;
    transactionHash: string;
  };
  metadata?: GradeVersionMetadata;
}

export interface GradeVersionHistory {
  gradeId: number;
  currentVersion: {
    database: Record<string, unknown>;
    blockchain: Record<string, unknown>;
    verification: {
      databaseHash: string;
      blockchainHash: string;
      hashesMatch: boolean;
      status: 'VERIFIED' | 'MISMATCH';
      lastVerified?: string | null;
    };
  };
  versionHistory: GradeVersion[];
  totalVersions: number;
  metadata: {
    gradeId: number;
    studentId: number;
    studentNumber: string;
    courseCode: string;
    courseName: string;
    currentStatus: GradeStatus;
    isVerified: boolean;
    totalUpdates: number;
  };
}

