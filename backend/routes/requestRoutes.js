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

router.post('/', protect, createRequest);
router.get('/my', protect, getMyRequests);
router.get('/incoming', protect, getIncomingRequests);
router.post('/:id/respond', protect, respondToRequest);
router.put('/:id/status', protect, updateRequestStatus);

module.exports = router;
