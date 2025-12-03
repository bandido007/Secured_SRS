'use strict';
const crypto = require('../Utils/crypto');

class CourseResult {
  static async submit(ctx, data) {
    const key = `result_${data.enrollmentId}`;
    const existing = await ctx.stub.getState(key);
    if (existing && existing.length > 0) {
      throw new Error(`Grade already exists for enrollment ${data.enrollmentId}`);
    }

    // Compute hash
    const hash = crypto.hash(JSON.stringify(data));
    const result = {
      ...data,
      status: 'PENDING',
      hash,
      createdAt: new Date().toISOString()
    };

    await ctx.stub.putState(key, Buffer.from(JSON.stringify(result)));

    // Add audit trail
    const auditKey = `audit_${key}_${Date.now()}`;
    const audit = {
      transactionType: 'CREATE',
      transactionId: ctx.stub.getTxID(),
      timestamp: new Date().toISOString(),
      performer: ctx.clientIdentity.getID(),
      hash
    };
    await ctx.stub.putState(auditKey, Buffer.from(JSON.stringify(audit)));

    return { message: 'Grade submitted successfully', resultId: key };
  }

  static async verify(ctx, resultId) {
    const bytes = await ctx.stub.getState(resultId);
    if (!bytes || bytes.length === 0) throw new Error('Grade not found');
    const result = JSON.parse(bytes.toString());

    if (result.status === 'OFFICIAL') throw new Error('Cannot verify official grade');

    const recomputed = crypto.hash(JSON.stringify(result));
    if (recomputed !== result.hash) {
      throw new Error('Integrity check failed - hash mismatch');
    }

    result.status = 'OFFICIAL';
    result.verifiedAt = new Date().toISOString();
    await ctx.stub.putState(resultId, Buffer.from(JSON.stringify(result)));

    return { message: 'Grade verified and made official', resultId };
  }

  static async getAuditTrail(ctx, resultId) {
    const iterator = await ctx.stub.getStateByRange('', '');
    const results = [];
    for await (const res of iterator) {
      const record = JSON.parse(res.value.toString());
      if (record.transactionType && res.key.includes(resultId)) {
        results.push(record);
      }
    }
    return results;
  }
}

module.exports = CourseResult;
