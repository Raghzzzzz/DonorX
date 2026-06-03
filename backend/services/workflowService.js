const EmergencyRequest = require('../models/EmergencyRequest');
const Hospital = require('../models/Hospital');
const { findMatchingHospitals } = require('./matchingService');
const { createAuditLog } = require('./auditService');
const { getIO } = require('../socket');

const emitToHospital = async (hospitalId, event, payload) => {
    const io = getIO();
    if (!io) return;

    io.to(String(hospitalId)).emit(event, payload);
};

const emitRequestToMatches = async (requestId) => {
    const fullRequest = await EmergencyRequest.findById(requestId)
        .populate('requestingHospital', 'name location')
        .populate('potentialMatches', 'name location');

    if (!fullRequest || !fullRequest.potentialMatches?.length) return;

    for (const hospital of fullRequest.potentialMatches) {
        const hospitalId = hospital._id || hospital;
        await emitToHospital(hospitalId, 'new_request', fullRequest);
    }
};

exports.notifyMatchedHospitals = emitRequestToMatches;

exports.processRequestMatching = async (requestId) => {
    try {
        const request = await EmergencyRequest.findById(requestId);
        if (!request || request.status !== 'Generated') {
            console.log(`Skipping matching for request ${requestId}: status is ${request?.status || 'not found'}`);
            return;
        }

        const matches = await findMatchingHospitals(request);

        if (matches.length > 0) {
            request.potentialMatches = matches;
            await request.save();
            await createAuditLog(requestId, 'MATCHES_FOUND', { count: matches.length, hospitals: matches });

            await emitRequestToMatches(requestId);
        } else {
            await createAuditLog(requestId, 'NO_MATCHES_FOUND', { radius: request.searchRadius || 5 });
        }
    } catch (error) {
        console.error(`Error in processRequestMatching for request ${requestId}:`, error);
    }
};

exports.expandSearchRadius = async (requestId) => {
    const request = await EmergencyRequest.findById(requestId);
    if (!request || request.status !== 'Generated') return;

    request.searchRadius += 5;
    await request.save();

    await createAuditLog(requestId, 'RADIUS_EXPANDED', { newRadius: request.searchRadius });

    await exports.processRequestMatching(requestId);
};

exports.handleAcceptance = async (requestId, hospitalId) => {
    const request = await EmergencyRequest.findById(requestId);
    if (!request) {
        throw new Error('Request not found');
    }

    if (request.status !== 'Generated') {
        throw new Error(`Request not available for acceptance. Current status: ${request.status}`);
    }

    const hospitalIdStr = hospitalId.toString();
    const matchesStr = request.potentialMatches.map((m) => m.toString());

    if (!matchesStr.includes(hospitalIdStr)) {
        throw new Error('Hospital not authorized to accept this request. Hospital not in potential matches.');
    }

    const hospital = await Hospital.findById(hospitalId);

    const { type, group, quantity, resourceCategory } = request.resourceNeeded;
    const category =
        resourceCategory ||
        (['ICU_BED', 'VENTILATOR', 'OXYGEN_CYLINDER', 'AMBULANCE'].includes(type) ? 'RESOURCE' : type);

    if (category === 'RESOURCE') {
        const resourceItem = hospital.resources?.find((r) => r.resourceType === type);
        if (!resourceItem || resourceItem.available < quantity) {
            throw new Error('Insufficient resources');
        }
        resourceItem.available -= quantity;
    } else {
        const inventoryItem = hospital.inventory.find((i) => i.type === type && i.group === group);
        if (!inventoryItem || inventoryItem.quantity < quantity) {
            throw new Error('Insufficient inventory');
        }
        inventoryItem.quantity -= quantity;
    }

    await hospital.save();

    request.status = 'Pending';
    request.assignedHospital = hospitalId;
    await request.save();

    await createAuditLog(requestId, 'REQUEST_ACCEPTED', { hospitalId, name: hospital.name });

    const updatedRequest = await EmergencyRequest.findById(requestId)
        .populate('assignedHospital', 'name location')
        .populate('requestingHospital', 'name location');

    await emitToHospital(request.requestingHospital, 'request_accepted', updatedRequest);
};

exports.updateLifecycle = async (requestId, status, locationData) => {
    const request = await EmergencyRequest.findById(requestId);
    if (!request) throw new Error('Request not found');

    const validTransitions = {
        Pending: ['Completed', 'Ended'],
    };

    if (!validTransitions[request.status]?.includes(status)) {
        throw new Error(`Invalid status transition from ${request.status} to ${status}`);
    }

    request.status = status;
    await request.save();

    await createAuditLog(requestId, `STATUS_UPDATE_${status.toUpperCase()}`, { location: locationData });
};

exports.handleTimeout = async (requestId) => {
    const request = await EmergencyRequest.findById(requestId);
    if (!request) return;

    if (request.status === 'Generated' && request.potentialMatches.length > 0) {
        await createAuditLog(requestId, 'MATCH_TIMEOUT', { matches: request.potentialMatches });

        request.potentialMatches = [];
        await request.save();

        await exports.processRequestMatching(requestId);

        const updated = await EmergencyRequest.findById(requestId);
        if (!updated.potentialMatches || updated.potentialMatches.length === 0) {
            await createAuditLog(requestId, 'NO_MATCH_AFTER_TIMEOUT', {});
            updated.status = 'Ended';
            await updated.save();
        }
    } else if (request.status === 'Generated') {
        await createAuditLog(requestId, 'NO_MATCH_AFTER_TIMEOUT', {});
        request.status = 'Ended';
        await request.save();
    }
};
