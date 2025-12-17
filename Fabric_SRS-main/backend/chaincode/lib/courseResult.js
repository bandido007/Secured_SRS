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

  static async update(ctx, resultId, updatedData) {
    // Get existing grade
    const bytes = await ctx.stub.getState(resultId);
    if (!bytes || bytes.length === 0) {
      throw new Error(`Grade not found: ${resultId}`);
    }

    const oldResult = JSON.parse(bytes.toString());

    // Authorization check: Only allow update if status is PENDING
    // if (oldResult.status === 'OFFICIAL') {
    //   throw new Error('Cannot update OFFICIAL grades. Contact administrator.');
    // }

    // Parse updated data
    const parsedData = typeof updatedData === 'string' ? JSON.parse(updatedData) : updatedData;

    // Store old version in audit trail FIRST (immutability principle)
    const auditKey = `audit_${resultId}_${Date.now()}`;
    const audit = {
      transactionType: 'UPDATE',
      transactionId: ctx.stub.getTxID(),
      timestamp: new Date().toISOString(),
      performer: ctx.clientIdentity.getID(),
      previousHash: oldResult.hash,
      oldValues: {
        gradeType: oldResult.gradeType,
        numericGrade: oldResult.numericGrade,
        letterGrade: oldResult.letterGrade,
        courseWorkGrade: oldResult.courseWorkGrade,
        examGrade: oldResult.examGrade,
        remarks: oldResult.remarks,
        status: oldResult.status
      },
      newValues: {
        gradeType: parsedData.gradeType,
        numericGrade: parsedData.numericGrade,
        letterGrade: parsedData.letterGrade,
        courseWorkGrade: parsedData.courseWorkGrade,
        examGrade: parsedData.examGrade,
        remarks: parsedData.remarks
      },
      reason: parsedData.updateReason || 'No reason provided',
      changes: []
    };

    // Track specific field changes
    const fields = ['gradeType', 'numericGrade', 'letterGrade', 'courseWorkGrade', 'examGrade', 'remarks'];
    for (const field of fields) {
      if (oldResult[field] !== parsedData[field]) {
        audit.changes.push({
          field,
          from: oldResult[field],
          to: parsedData[field]
        });
      }
    }

    // Store audit record in blockchain (immutable)
    await ctx.stub.putState(auditKey, Buffer.from(JSON.stringify(audit)));

    // Create updated result object
    const updatedResult = {
      ...oldResult,
      gradeType: parsedData.gradeType,
      numericGrade: parsedData.numericGrade,
      letterGrade: parsedData.letterGrade,
      courseWorkGrade: parsedData.courseWorkGrade,
      examGrade: parsedData.examGrade,
      remarks: parsedData.remarks,
      status: 'PENDING',  // Reset to pending after update
      isVerified: false,
      updatedAt: new Date().toISOString(),
      previousHash: oldResult.hash  // Link to previous version
    };

    // Recompute hash with new data
    const newHash = crypto.hash(JSON.stringify({
      enrollmentId: updatedResult.enrollmentId,
      gradeType: updatedResult.gradeType,
      numericGrade: updatedResult.numericGrade,
      letterGrade: updatedResult.letterGrade,
      courseWorkGrade: updatedResult.courseWorkGrade,
      examGrade: updatedResult.examGrade
    }));

    updatedResult.hash = newHash;

    // Update the grade record in blockchain
    await ctx.stub.putState(resultId, Buffer.from(JSON.stringify(updatedResult)));

    return {
      message: 'Grade updated successfully',
      resultId,
      transactionId: ctx.stub.getTxID(),
      previousHash: oldResult.hash,
      newHash,
      changesCount: audit.changes.length
    };
  }

  static async getVersionHistory(ctx, resultId) {
    // Get current grade
    const currentBytes = await ctx.stub.getState(resultId);
    if (!currentBytes || currentBytes.length === 0) {
      throw new Error(`Grade not found: ${resultId}`);
    }
    const current = JSON.parse(currentBytes.toString());

    // Get all audit records for this grade
    const iterator = await ctx.stub.getStateByRange('', '');
    const versions = [];

    for await (const res of iterator) {
      const key = res.key;
      if (key.startsWith(`audit_${resultId}`)) {
        try {
          const audit = JSON.parse(res.value.toString());
          versions.push({
            versionNumber: versions.length + 1,
            timestamp: audit.timestamp,
            transactionType: audit.transactionType,
            transactionId: audit.transactionId,
            performer: audit.performer,
            oldValues: audit.oldValues || null,
            newValues: audit.newValues || null,
            changes: audit.changes || [],
            reason: audit.reason || '',
            previousHash: audit.previousHash,
            hash: audit.hash
          });
        } catch (e) {
          console.error(`Error parsing audit record ${key}:`, e);
        }
      }
    }

    // Sort by timestamp (oldest first)
    versions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Re-number versions
    versions.forEach((v, idx) => {
      v.versionNumber = idx + 1;
    });

    return {
      currentGrade: {
        resultId,
        enrollmentId: current.enrollmentId,
        gradeType: current.gradeType,
        numericGrade: current.numericGrade,
        letterGrade: current.letterGrade,
        courseWorkGrade: current.courseWorkGrade,
        examGrade: current.examGrade,
        remarks: current.remarks,
        status: current.status,
        hash: current.hash,
        createdAt: current.createdAt,
        updatedAt: current.updatedAt
      },
      versionHistory: versions,
      totalVersions: versions.length,
      totalUpdates: versions.filter(v => v.transactionType === 'UPDATE').length
    };
  }

  static async verifyIntegrity(ctx, resultId) {
    // Get current grade
    const bytes = await ctx.stub.getState(resultId);
    if (!bytes || bytes.length === 0) {
      throw new Error(`Grade not found: ${resultId}`);
    }
    const result = JSON.parse(bytes.toString());

    // Recompute hash from current data
    const computedHash = crypto.hash(JSON.stringify({
      enrollmentId: result.enrollmentId,
      gradeType: result.gradeType,
      numericGrade: result.numericGrade,
      letterGrade: result.letterGrade,
      courseWorkGrade: result.courseWorkGrade,
      examGrade: result.examGrade
    }));

    const isValid = computedHash === result.hash;

    return {
      resultId,
      isValid,
      storedHash: result.hash,
      computedHash,
      status: isValid ? 'VERIFIED' : 'TAMPERED',
      message: isValid
        ? 'Integrity verified - data matches blockchain hash'
        : 'TAMPERING DETECTED - hash mismatch!',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = CourseResult;
