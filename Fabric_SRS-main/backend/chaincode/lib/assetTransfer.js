'use strict';
const stringify = require('json-stringify-deterministic');
const { ClientIdentity } = require('fabric-shim');
const { Contract } = require('fabric-contract-api');
const Student = require('./student');
const Lecturer = require('./lecturer');
const Course = require('./course');
const Enrollment = require('./enrollment');
const CourseResult = require('./courseResult');
const Transcript = require('./transcript');

class SRSContract extends Contract {
  async InitLedger(ctx) {
    const students = [];
    const lecturers = [];
    const courses = [
        {
            courseId: 'CS101',
            courseCode: 'CS101',
            courseName: 'Introduction to Programming',
            credits: 7.5,
            department: 'Computer Science',
            assignedLecturerId: null,
            description: 'Fundamentals of programming using Python',
            isActive: true,
            createdDate: "2025-12-09"
        },
        {
            courseId: 'MAT201',
            courseCode: 'MAT201',
            courseName: 'Discrete Mathematics',
            credits: 9.0,
            department: 'Mathematics',
            assignedLecturerId: null,
            description: 'Discrete mathematical structures',
            isActive: true,
            createdDate: "2025-10-12"
        }
    ];
    const enrollments = [];
    const grades = [];
    const transcripts = [];


    await ctx.stub.putState('Students', Buffer.from(stringify(students)));
    await ctx.stub.putState('Lecturers', Buffer.from(stringify(lecturers)));
    await ctx.stub.putState('Courses', Buffer.from(stringify(courses)));
    await ctx.stub.putState('Enrollments', Buffer.from(stringify(enrollments)));
    await ctx.stub.putState('Grades', Buffer.from(stringify(grades)));
    await ctx.stub.putState('Transcripts', Buffer.from(stringify(transcripts)));

    for (const course of courses) {
        await ctx.stub.putState(course.courseId, Buffer.from(stringify(course)));
    }

    return 'Ledger initialized with SRS domain structure';
  }

  
  // ========== STUDENTS ==========
  async createStudent(ctx, studentData) {
    return await Student.create(ctx, JSON.parse(studentData));
  }

  async getStudent(ctx, studentId) {
    return await Student.get(ctx, studentId);
  }

  async listStudents(ctx) {
    return await Student.list(ctx);
  }

  async updateStudent(ctx, studentId, updates) {
    return await Student.update(ctx, studentId, JSON.parse(updates));
  }

  async deactivateStudent(ctx, studentId) {
    return await Student.deactivate(ctx, studentId);
  }

  // ========== LECTURERS ==========
  async createLecturer(ctx, data) {
    return await Lecturer.create(ctx, JSON.parse(data));
  }

  async listLecturers(ctx) {
    return await Lecturer.list(ctx);
  }

  // ========== COURSES ==========
  async createCourse(ctx, data) {
    return await Course.create(ctx, JSON.parse(data));
  }

  async listCourses(ctx) {
    return await Course.list(ctx);
  }

  // ========== ENROLLMENTS ==========
  async createEnrollment(ctx, data) {
    return await Enrollment.create(ctx, JSON.parse(data));
  }

  async listEnrollments(ctx) {
    return await Enrollment.list(ctx);
  }

  // ========== COURSE RESULTS ==========
  async submitGrade(ctx, data) {
    return await CourseResult.submit(ctx, JSON.parse(data));
  }

  async verifyGrade(ctx, resultId) {
    return await CourseResult.verify(ctx, resultId);
  }

  async getGradeAuditTrail(ctx, resultId) {
    return await CourseResult.getAuditTrail(ctx, resultId);
  }

  // ========== TRANSCRIPTS ==========
  async generateTranscript(ctx, data) {
    return await Transcript.generate(ctx, JSON.parse(data));
  }

  async listTranscripts(ctx, studentId) {
    return await Transcript.list(ctx, studentId);
  }
}

module.exports = SRSContract;
