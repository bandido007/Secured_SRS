/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */


'use strict';

const stringify = require('json-stringify-deterministic');
const { Contract } = require('fabric-contract-api');
const { ClientIdentity } = require('fabric-shim');

class StudentResultsContract extends Contract {

    // =============================
    // User Identity
    // =============================
    async getUserAttrs(ctx) {
        const cid = new ClientIdentity(ctx.stub);
        return {
            id: cid.getID(),
            mspId: cid.getMSPID(),
            userType: cid.getAttributeValue('type') || 'unknown'
        };
    }

    // =============================
    // 🏁 Ledger Initialization
    // =============================
    async InitLedger(ctx) {
        const courses = [
            {
                courseId: 'CSC101',
                courseName: 'Introduction to Programming',
                lecturer: 'Dr. John Doe',
                results: []
            },
            {
                courseId: 'MAT201',
                courseName: 'Discrete Mathematics',
                lecturer: 'Prof. Mary Jane',
                results: []
            }
        ];

        await ctx.stub.putState('Courses', Buffer.from(stringify(courses)));

        // Store individual course entries for easier queries
        for (const course of courses) {
            await ctx.stub.putState(course.courseId, Buffer.from(stringify(course)));
        }

        return 'Ledger initialized with sample courses';
    }

    // =============================
    // Lecturer uploads results
    // =============================
    /**
     * Upload results for a course in JSON format.
     * Example result JSON:
     * [
     *   { "studentId": "ST001", "name": "Alice", "score": 85, "grade": "A" },
     *   { "studentId": "ST002", "name": "Bob", "score": 72, "grade": "B" }
     * ]
     */
    uploadResults(ctx, courseId, resultsJson) {
        const courseBytes = ctx.stub.getState(courseId);
        if (!courseBytes || courseBytes.length === 0) {
            throw new Error(`Course ${courseId} not found`);
        }

        const course = JSON.parse(courseBytes.toString());
        const results = JSON.parse(resultsJson);

        // Optional: validate input
        if (!Array.isArray(results)) {
            throw new Error('Invalid results format. Must be a JSON array.');
        }

        course.results = results;
        ctx.stub.putState(courseId, Buffer.from(stringify(course)));

        // Update the global list of courses
        let allCourses = ctx.stub.getState('Courses');
        allCourses = allCourses.length ? JSON.parse(allCourses.toString()) : [];
        const index = allCourses.findIndex(c => c.courseId === courseId);
        if (index !== -1) {
            allCourses[index] = course;
        } else {
            allCourses.push(course);
        }
        ctx.stub.putState('Courses', Buffer.from(stringify(allCourses)));

        return stringify({ status: 200, message: `Results uploaded for ${course.courseName}` });
    }

    // =============================
    // Query all courses
    // =============================
    async getAllCourses(ctx) {
        const coursesBytes = await ctx.stub.getState('Courses');
        if (!coursesBytes || coursesBytes.length === 0) {
            throw new Error('No courses found');
        }
        return coursesBytes.toString();
    }

    // =============================
    // Get results by course
    // =============================
    async getCourseResults(ctx, courseId) {
        const courseBytes = await ctx.stub.getState(courseId);
        if (!courseBytes || courseBytes.length === 0) {
            throw new Error(`Course ${courseId} not found`);
        }
        const course = JSON.parse(courseBytes.toString());
        return stringify(course.results);
    }

    // =============================
    // Get result by student ID
    // =============================
    async getStudentResult(ctx, courseId, studentId) {
        const courseBytes = await ctx.stub.getState(courseId);
        if (!courseBytes || courseBytes.length === 0) {
            throw new Error(`Course ${courseId} not found`);
        }

        const course = JSON.parse(courseBytes.toString());
        const student = course.results.find(r => r.studentId === studentId);

        if (!student) {
            throw new Error(`Student ${studentId} not found in ${courseId}`);
        }

        return stringify(student);
    }

    // =============================
    // Add new course
    // =============================
    async addCourse(ctx, courseId, courseName, lecturer) {
        const course = {
            courseId,
            courseName,
            lecturer,
            results: []
        };

        await ctx.stub.putState(courseId, Buffer.from(stringify(course)));

        let allCourses = await ctx.stub.getState('Courses');
        allCourses = allCourses.length ? JSON.parse(allCourses.toString()) : [];
        allCourses.push(course);
        await ctx.stub.putState('Courses', Buffer.from(stringify(allCourses)));

        return stringify({ status: 200, message: `Course ${courseName} added successfully` });
    }
}

module.exports = StudentResultsContract;
