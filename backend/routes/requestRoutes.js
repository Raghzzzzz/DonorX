const express = require('express');
const router = express.Router();
const {
    createRequest,
    getMyRequests,
    getIncomingRequests,
    respondToRequest,
    updateRequestStatus
} = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

router.post('/', protect, asyncHandler(createRequest));
router.get('/my', protect, asyncHandler(getMyRequests));
router.get('/incoming', protect, asyncHandler(getIncomingRequests));
router.post('/:id/respond', protect, asyncHandler(respondToRequest));
router.put('/:id/status', protect, asyncHandler(updateRequestStatus));

module.exports = router;
