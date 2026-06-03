const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
    resourceCategory: {
        type: String,
        enum: ['BLOOD', 'ORGAN', 'RESOURCE'],
        default: 'BLOOD',
    },
    type: {
        type: String,
        required: true,
    },
    group: {
        type: String,
        default: '',
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    }
});

const EmergencyRequestSchema = new mongoose.Schema({
    requestId: {
        type: String,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString()
    },
    patientName: {
        type: String,
        required: true
    },
    urgency: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        required: true
    },
    condition: {
        type: String,
        required: true
    },
    resourceNeeded: ResourceSchema,
    requestingHospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            index: '2dsphere'
        }
    },
    status: {
        type: String,
        enum: ['Generated', 'Pending', 'Completed', 'Ended'],
        default: 'Generated'
    },
    priorityScore: {
        type: Number,
        default: 0
    },
    searchRadius: {
        type: Number,
        default: 5 // km
    },
    potentialMatches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital'
    }],
    assignedHospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        default: null
    },
    aiSummary: {
        type: String,
        default: '',
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Keep updatedAt in sync for scheduler and analytics
EmergencyRequestSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
});

module.exports = mongoose.model('EmergencyRequest', EmergencyRequestSchema);
