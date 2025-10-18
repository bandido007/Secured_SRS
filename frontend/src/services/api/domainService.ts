import { apiClient } from './client';
import type {
  AcademicTranscript,
  ApiResponse,
  AuditTrailFilters,
  Course,
  CourseFilters,
  CourseInput,
  CourseResult,
  CourseResultFilters,
  CourseResultInput,
  Enrollment,
  EnrollmentFilters,
  EnrollmentInput,
  Lecturer,
  LecturerFilters,
  LecturerInput,
  PagedResponse,
  RecordTransaction,
  Student,
  StudentFilters,
  StudentInput,
  TranscriptFilters,
  TranscriptInput,
} from '../../types';

const BASE_URL = '/domain';

export const domainService = {
  students: {
    list(params?: StudentFilters) {
      return apiClient.get<PagedResponse<Student>>(`${BASE_URL}/students`, params);
    },
    getMe() {
      return apiClient.get<ApiResponse<Student>>(`${BASE_URL}/students/me`);
    },
    get(studentId: number) {
      return apiClient.get<ApiResponse<Student>>(`${BASE_URL}/students/${studentId}`);
    },
    create(data: StudentInput) {
      return apiClient.post<ApiResponse>(`${BASE_URL}/students`, data);
    },
    update(studentId: number, data: StudentInput) {
      return apiClient.put<ApiResponse>(`${BASE_URL}/students/${studentId}`, data);
    },
    deactivate(studentId: number) {
      return apiClient.delete<ApiResponse>(`${BASE_URL}/students/${studentId}`);
    },
    grades(studentId: number, params?: CourseResultFilters) {
      return apiClient.get<PagedResponse<CourseResult>>(
        `${BASE_URL}/students/${studentId}/grades`,
        params
      );
    },
    transcripts(studentId: number, params?: TranscriptFilters) {
      return apiClient.get<PagedResponse<AcademicTranscript>>(
        `${BASE_URL}/students/${studentId}/transcripts`,
        params
      );
    },
  },

  lecturers: {
    list(params?: LecturerFilters) {
      return apiClient.get<PagedResponse<Lecturer>>(`${BASE_URL}/lecturers`, params);
    },
    getMe() {
      return apiClient.get<ApiResponse<Lecturer>>(`${BASE_URL}/lecturers/me`);
    },
    create(data: LecturerInput) {
      return apiClient.post<ApiResponse>(`${BASE_URL}/lecturers`, data);
    },
    update(lecturerId: number, data: LecturerInput) {
      return apiClient.put<ApiResponse>(`${BASE_URL}/lecturers/${lecturerId}`, data);
    },
    deactivate(lecturerId: number) {
      return apiClient.delete<ApiResponse>(`${BASE_URL}/lecturers/${lecturerId}`);
    },
  },

  courses: {
    list(params?: CourseFilters) {
      return apiClient.get<PagedResponse<Course>>(`${BASE_URL}/courses`, params);
    },
    create(data: CourseInput) {
      return apiClient.post<ApiResponse>(`${BASE_URL}/courses`, data);
    },
    update(courseId: number, data: CourseInput) {
      return apiClient.put<ApiResponse>(`${BASE_URL}/courses/${courseId}`, data);
    },
    deactivate(courseId: number) {
      return apiClient.delete<ApiResponse>(`${BASE_URL}/courses/${courseId}`);
    },
  },

  enrollments: {
    list(params?: EnrollmentFilters) {
      return apiClient.get<PagedResponse<Enrollment>>(`${BASE_URL}/enrollments`, params);
    },
    create(data: EnrollmentInput) {
      return apiClient.post<ApiResponse>(`${BASE_URL}/enrollments`, data);
    },
    deactivate(enrollmentId: number) {
      return apiClient.delete<ApiResponse>(`${BASE_URL}/enrollments/${enrollmentId}`);
    },
  },

  courseResults: {
    list(params?: CourseResultFilters) {
      return apiClient.get<PagedResponse<CourseResult>>(`${BASE_URL}/course-results`, params);
    },
    submit(data: CourseResultInput) {
      return apiClient.post<ApiResponse>(`${BASE_URL}/course-results`, data);
    },
    verify(gradeId: number) {
      return apiClient.post<ApiResponse>(`${BASE_URL}/course-results/${gradeId}/verify`);
    },
    auditTrail(gradeId: number, params?: AuditTrailFilters) {
      return apiClient.get<PagedResponse<RecordTransaction>>(
        `${BASE_URL}/course-results/${gradeId}/audit-trail`,
        params
      );
    },
  },

  transcripts: {
    generate(payload: TranscriptInput) {
      return apiClient.post<ApiResponse>(`${BASE_URL}/transcripts/generate`, payload);
    },
  },
};
