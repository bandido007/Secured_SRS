'use strict';

class Student {
  static async create(ctx, data) {
    const exists = await ctx.stub.getState(data.studentId);
    if (exists && exists.length > 0) {
      throw new Error(`Student ${data.studentId} already exists`);
    }

    data.type = 'student';
    // data.createdDate = new Date().toISOString();
    // data.updatedDate = data.createdDate;
    data.isActive = true;

    await ctx.stub.putState(data.studentId, Buffer.from(JSON.stringify(data)));
    return { message: 'Student created successfully', studentId: data.studentId };
  }

  static async get(ctx, studentId) {
    const studentBytes = await ctx.stub.getState(studentId);
    if (!studentBytes || studentBytes.length === 0) {
      throw new Error(`Student ${studentId} not found`);
    }
    return JSON.parse(studentBytes.toString());
  }

  static async list(ctx) {
    const iterator = await ctx.stub.getStateByRange('', '');
    const results = [];
    for await (const res of iterator) {
      const record = JSON.parse(res.value.toString());
      if (record.type === 'student') results.push(record);
    }
    return results;
  }

  static async update(ctx, studentId, updates) {
    const student = await this.get(ctx, studentId);
    Object.assign(student, updates);
    student.updatedDate = new Date().toISOString();
    await ctx.stub.putState(studentId, Buffer.from(JSON.stringify(student)));
    return { message: 'Student updated successfully', studentId };
  }

  static async deactivate(ctx, studentId) {
    const student = await this.get(ctx, studentId);
    student.isActive = false;
    student.enrollmentStatus = 'WITHDRAWN';
    await ctx.stub.putState(studentId, Buffer.from(JSON.stringify(student)));
    return { message: 'Student deactivated', studentId };
  }
}

module.exports = Student;
