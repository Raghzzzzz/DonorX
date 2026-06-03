const express = require('express');
const router = express.Router();
const { getResources, updateResources } = require('../controllers/resourceController');
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

router.get('/', protect, asyncHandler(getResources));
router.put('/', protect, asyncHandler(updateResources));

module.exports = router;
