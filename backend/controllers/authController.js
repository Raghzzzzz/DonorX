const Hospital = require('../models/Hospital');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new hospital
// @route   POST /api/auth/register
// @access  Public
exports.registerHospital = async (req, res) => {
    const { name, email, password, location } = req.body;
    // location expect: { lat: Number, lon: Number }

    try {
        const hospitalExists = await Hospital.findOne({ email });

        if (hospitalExists) {
            return res.status(400).json({ message: 'Hospital already exists' });
        }

        const hospital = await Hospital.create({
            name,
            email,
            password,
            location: {
                type: 'Point',
                coordinates: [location.lon, location.lat]
            },
            // Pre-allocate some demo inventory so dashboards are never empty
            inventory: [
                { type: 'BLOOD', group: 'O+', quantity: 10 },
                { type: 'BLOOD', group: 'O-', quantity: 4 },
                { type: 'BLOOD', group: 'A+', quantity: 6 },
                { type: 'BLOOD', group: 'B+', quantity: 5 },
                { type: 'ORGAN', group: 'Kidney', quantity: 1 },
                { type: 'ORGAN', group: 'Liver', quantity: 1 }
            ]
        });

        if (hospital) {
            res.status(201).json({
                _id: hospital._id,
                name: hospital.name,
                email: hospital.email,
                location: hospital.location,
                token: generateToken(hospital._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid hospital data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth hospital & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginHospital = async (req, res) => {
    const { email, password } = req.body;

    try {
        const hospital = await Hospital.findOne({ email });

        if (hospital && (await hospital.matchPassword(password))) {
            res.json({
                _id: hospital._id,
                name: hospital.name,
                email: hospital.email,
                location: hospital.location,
                token: generateToken(hospital._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
