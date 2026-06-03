const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const HospitalResourceSchema = new mongoose.Schema({
    resourceType: {
        type: String,
        enum: ['ICU_BED', 'VENTILATOR', 'OXYGEN_CYLINDER', 'AMBULANCE'],
        required: true,
    },
    available: {
        type: Number,
        default: 0,
    },
    total: {
        type: Number,
        default: 0,
    },
});

const InventoryItemSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['BLOOD', 'ORGAN'],
        required: true
    },
    group: {
        type: String, // e.g., 'A+', 'O-', 'Kidney', 'Liver'
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 0
    }
});

const HospitalSchema = new mongoose.Schema({
    hospitalId: {
        type: String,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString()
    },
    name: {
        type: String,
        required: true
    },
    email: { // Added for login
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    inventory: [InventoryItemSchema],
    resources: [HospitalResourceSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for geospatial queries
HospitalSchema.index({ location: '2dsphere' });

// Match password
HospitalSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
HospitalSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('Hospital', HospitalSchema);
