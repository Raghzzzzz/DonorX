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
        // Validate required fields
        if (!patientName || typeof patientName !== 'string' || patientName.trim() === '') {
            return res.status(400).json({ 
                message: 'Invalid patientName: must be a non-empty string' 
            });
        }

        if (!urgency || !['Low', 'Medium', 'High', 'Critical'].includes(urgency)) {
            return res.status(400).json({ 
                message: 'Invalid urgency: must be one of Low, Medium, High, Critical' 
            });
        }

        if (!condition || typeof condition !== 'string' || condition.trim() === '') {
            return res.status(400).json({ 
                message: 'Invalid condition: must be a non-empty string' 
            });
        }

        if (!resourceNeeded || typeof resourceNeeded !== 'object') {
            return res.status(400).json({ 
                message: 'Missing or invalid resourceNeeded: must be an object' 
            });
        }

        if (!resourceNeeded.type || !['BLOOD', 'ORGAN'].includes(resourceNeeded.type)) {
            return res.status(400).json({ 
                message: 'Invalid resourceNeeded.type: must be BLOOD or ORGAN' 
            });
        }

        if (!resourceNeeded.group || typeof resourceNeeded.group !== 'string') {
            return res.status(400).json({ 
                message: 'Invalid resourceNeeded.group: must be a string (e.g., A+, O-, Kidney)' 
            });
        }

        if (!resourceNeeded.quantity || typeof resourceNeeded.quantity !== 'number' || resourceNeeded.quantity < 1) {
            return res.status(400).json({ 
                message: 'Invalid resourceNeeded.quantity: must be a number >= 1' 
            });
        }

        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Not authorized: user not found' });
        }

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

        console.log('Creating request with data:', {
            patientName,
            urgency,
            condition,
            resourceNeeded,
            requestingHospital: req.user._id,
            hasLocation: !!(location && location.lat && location.lon)
        });

        const request = new EmergencyRequest(newRequestData);

        // Calculate Priority (before save, so createdAt might not be set yet)
        try {
            request.priorityScore = calculatePriority(request);
        } catch (priorityError) {
            console.error('Priority calculation error:', priorityError);
            // Default to urgency-based score if calculation fails
            const urgencyScores = { 'Critical': 50, 'High': 40, 'Medium': 20, 'Low': 10 };
            request.priorityScore = urgencyScores[urgency] || 0;
        }

        console.log('Request object before save:', {
            patientName: request.patientName,
            urgency: request.urgency,
            status: request.status,
            priorityScore: request.priorityScore,
            hasLocation: !!request.location
        });

        let createdRequest;
        try {
            createdRequest = await request.save();
            console.log('Request saved successfully:', createdRequest._id);
        } catch (saveError) {
            console.error('Save error details:', {
                message: saveError.message,
                name: saveError.name,
                errors: saveError.errors,
                stack: saveError.stack
            });
            throw saveError;
        }

        // Audit Log (non-blocking - don't fail if audit log fails)
        createAuditLog(createdRequest._id, 'REQUEST_CREATED', {
            urgency,
            resource: resourceNeeded
        }).catch(err => console.error('Audit log error (non-critical):', err));

        // Run matching before responding so other hospitals see the request in incoming immediately
        try {
            await processRequestMatching(createdRequest._id);
        } catch (matchErr) {
            console.error('Matching workflow error (non-critical):', matchErr);
        }

        // Refetch so response includes populated potentialMatches if needed
        const toSend = await EmergencyRequest.findById(createdRequest._id);
        res.status(201).json(toSend || createdRequest);
    } catch (error) {
        console.error('Error creating request:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                message: 'Validation error',
                errors: validationErrors
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'Duplicate entry: A request with this ID already exists'
            });
        }

        // Generic error
        res.status(500).json({ 
            message: error.message || 'Failed to create request',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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
        console.log('Respond to request:', { requestId, response, hospitalId: req.user._id });
        
        if (response === 'Accept') {
            await handleAcceptance(requestId, req.user._id);
            // Fetch updated request to return full details
            const updatedRequest = await EmergencyRequest.findById(requestId)
                .populate('assignedHospital', 'name location')
                .populate('requestingHospital', 'name location');
            res.json({ 
                message: 'Request accepted successfully',
                request: updatedRequest
            });
        } else {
            // Deny logic: Remove from potentialMatches
            // For MVP simplicity, just log it. Real app would remove visibility.
            await createAuditLog(requestId, 'REQUEST_DENIED', { hospitalId: req.user._id });
            res.json({ message: 'Request denied' });
        }
    } catch (error) {
        console.error('Error responding to request:', error);
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
