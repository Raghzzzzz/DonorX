const express = require('express');
const multer = require('multer');
const { parseReport } = require('../controllers/assistController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

router.post('/parse-report', protect, upload.single('report'), parseReport);

module.exports = router;
