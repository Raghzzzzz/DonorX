const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
    registerHospital,
    loginHospital,
    registerValidation,
    loginValidation,
} = require('../controllers/authController');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Too many login attempts, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { message: 'Too many registration attempts, please try again after an hour' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/register', registerLimiter, registerValidation, registerHospital);
router.post('/login', loginLimiter, loginValidation, loginHospital);

module.exports = router;
