const express = require('express');
const router = express.Router();
const { getHospitalNetwork } = require('../controllers/hospitalController');

router.get('/network', getHospitalNetwork);

module.exports = router;
