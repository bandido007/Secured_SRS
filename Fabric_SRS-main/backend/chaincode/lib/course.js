'use strict';

class Course {
  static async create(ctx, data) {
    const exists = await ctx.stub.getState(data.courseId);
    if (exists && exists.length > 0) {
      throw new Error(`Course ${data.courseId} already exists`);
    }

    data.type = 'Course';
    data.createdDate = new Date().toISOString();
    data.updatedDate = data.createdDate;
    data.isActive = true;

    await ctx.stub.putState(data.courseId, Buffer.from(JSON.stringify(data)));
    return { message: 'Course created successfully', courseId: data.courseId };
  }

  static async list(ctx) {
    const iterator = await ctx.stub.getStateByRange('', '');
    const results = [];

    let result = await iterator.next();
    while (!result.done) {
      const strValue = result.value.value.toString('utf8');
      try {
        const record = JSON.parse(strValue);
        if (record.type === 'Course') results.push(record);
      } catch (err) {
        console.error('Error parsing record:', err);
      }
      result = await iterator.next();
    }

    await iterator.close();
    return results;
  }
}

module.exports = Course;
