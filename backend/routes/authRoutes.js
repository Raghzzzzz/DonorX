const express = require('express');
const router = express.Router();
const { registerHospital, loginHospital } = require('../controllers/authController');

router.post('/register', registerHospital);
router.post('/login', loginHospital);

module.exports = router;
