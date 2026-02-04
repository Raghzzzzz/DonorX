const AuditLog = require('../models/AuditLog');
const crypto = require('crypto');

const createAuditLog = async (requestId, action, payload) => {
    try {
        // Find the last log for this request to get prevHash
        const lastLog = await AuditLog.findOne({ requestId }).sort({ timestamp: -1 });

        const prevHash = lastLog ? lastLog.hash : 'GENESIS_HASH';

        // Create hash of current data + prevHash
        const dataToHash = `${requestId}${action}${JSON.stringify(payload)}${prevHash}${new Date().toISOString()}`;
        const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');

        const log = await AuditLog.create({
            requestId,
            action,
            payload,
            prevHash,
            hash
        });

        return log;
    } catch (error) {
        // Log but don't fail the request if audit logging fails
        console.error('Audit log creation failed:', error);
        return null;
    }
};

module.exports = { createAuditLog };
