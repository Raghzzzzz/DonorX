const EmergencyRequest = require('../models/EmergencyRequest');
const { calculatePriority } = require('../services/priorityService');
const { createAuditLog } = require('../services/auditService');
const {
    processRequestMatching,
    handleAcceptance,
    updateLifecycle
} = require('../services/workflowService');

// @desc    Create new emergency request
// @route   POST /api/requests
// @access  Private
exports.createRequest = async (req, res) => {
    const { patientName, urgency, condition, resourceNeeded, location } = req.body;

    try {
        const newRequestData = {
            patientName,
            urgency,
            condition,
            resourceNeeded,
            requestingHospital: req.user._id,
        };

        if (location && location.lat && location.lon) {
            newRequestData.location = {
                type: 'Point',
                coordinates: [location.lon, location.lat]
            };
        }

        const request = new EmergencyRequest(newRequestData);

        // Calculate Priority
        request.priorityScore = calculatePriority(request);

        const createdRequest = await request.save();

        // Audit Log
        await createAuditLog(createdRequest._id, 'REQUEST_CREATED', {
            urgency,
            resource: resourceNeeded
        });

        // Trigger Workflow (Matching) - Async
        processRequestMatching(createdRequest._id);

        res.status(201).json(createdRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get requests created by hospital
// @route   GET /api/requests/my
// @access  Private
exports.getMyRequests = async (req, res) => {
    try {
        const requests = await EmergencyRequest.find({ requestingHospital: req.user._id })
            .populate('assignedHospital', 'name location')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get incoming requests (matched to this hospital)
// @route   GET /api/requests/incoming
// @access  Private
exports.getIncomingRequests = async (req, res) => {
    try {
        const requests = await EmergencyRequest.find({
            potentialMatches: req.user._id,
            status: 'Generated'
        })
            .populate('requestingHospital', 'name location')
            .sort({ priorityScore: -1 }); // High priority first

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Respond to request (Accept/Deny)
// @route   POST /api/requests/:id/respond
// @access  Private
exports.respondToRequest = async (req, res) => {
    const { response } = req.body; // 'Accept' or 'Deny'
    const requestId = req.params.id;

    try {
        if (response === 'Accept') {
            await handleAcceptance(requestId, req.user._id);
            res.json({ message: 'Request accepted successfully' });
        } else {
            // Deny logic: Remove from potentialMatches
            // For MVP simplicity, just log it. Real app would remove visibility.
            await createAuditLog(requestId, 'REQUEST_DENIED', { hospitalId: req.user._id });
            res.json({ message: 'Request denied' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update request status
// @route   POST /api/requests/:id/status
// @access  Private
exports.updateRequestStatus = async (req, res) => {
    const { status, location } = req.body;
    const requestId = req.params.id;

    try {
        await updateLifecycle(requestId, status, location);
        res.json({ message: `Request status updated to ${status}` });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
