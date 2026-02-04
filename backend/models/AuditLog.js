const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmergencyRequest',
        required: true
    },
    action: {
        type: String,
        required: true
    },
    payload: {
        type: Object, // Stores details of the action
    },
    prevHash: {
        type: String,
        required: true // Simulates blockchain chain
    },
    hash: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
