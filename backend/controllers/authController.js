const Hospital = require('../models/Hospital');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const registerValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('location.lat').isNumeric().withMessage('location.lat must be a number'),
    body('location.lon').isNumeric().withMessage('location.lon must be a number'),
];

const loginValidation = [
    body('email').notEmpty().withMessage('Email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

// @desc    Register a new hospital
// @route   POST /api/auth/register
// @access  Public
exports.registerHospital = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array(),
        });
    }

    const { name, email, password, location } = req.body;

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
                coordinates: [location.lon, location.lat],
            },
            inventory: [
                { type: 'BLOOD', group: 'O+', quantity: 10 },
                { type: 'BLOOD', group: 'O-', quantity: 4 },
                { type: 'BLOOD', group: 'A+', quantity: 6 },
                { type: 'BLOOD', group: 'B+', quantity: 5 },
                { type: 'ORGAN', group: 'Kidney', quantity: 1 },
                { type: 'ORGAN', group: 'Liver', quantity: 1 },
            ],
            resources: [
                { resourceType: 'ICU_BED', available: 5, total: 10 },
                { resourceType: 'VENTILATOR', available: 3, total: 6 },
                { resourceType: 'OXYGEN_CYLINDER', available: 20, total: 30 },
                { resourceType: 'AMBULANCE', available: 2, total: 4 },
            ],
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array(),
        });
    }

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

exports.registerValidation = registerValidation;
exports.loginValidation = loginValidation;
