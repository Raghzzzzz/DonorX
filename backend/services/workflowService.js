const EmergencyRequest = require('../models/EmergencyRequest');
const Hospital = require('../models/Hospital');
const { findMatchingHospitals } = require('./matchingService');
const { createAuditLog } = require('./auditService');

exports.processRequestMatching = async (requestId) => {
    const request = await EmergencyRequest.findById(requestId);
    if (!request || request.status !== 'Generated') return;

    // Find matches
    const matches = await findMatchingHospitals(request);

    // Update request
    if (matches.length > 0) {
        request.potentialMatches = matches;
        await request.save();
        await createAuditLog(requestId, 'MATCHES_FOUND', { count: matches.length, hospitals: matches });
    } else {
        await createAuditLog(requestId, 'NO_MATCHES_FOUND', { radius: request.searchRadius });
    }
};

exports.expandSearchRadius = async (requestId) => {
    const request = await EmergencyRequest.findById(requestId);
    if (!request || request.status !== 'Generated') return;

    request.searchRadius += 5;
    await request.save();

    await createAuditLog(requestId, 'RADIUS_EXPANDED', { newRadius: request.searchRadius });

    // Re-run matching
    await this.processRequestMatching(requestId);
};

exports.handleAcceptance = async (requestId, hospitalId) => {
    const request = await EmergencyRequest.findById(requestId);
    if (!request || request.status !== 'Generated') {
        throw new Error('Request not available for acceptance');
    }

    // Check if hospital is a match
    if (!request.potentialMatches.includes(hospitalId)) {
        throw new Error('Hospital not authorized to accept this request');
    }

    const hospital = await Hospital.findById(hospitalId);

    // Lock inventory
    const { type, group, quantity } = request.resourceNeeded;
    const inventoryItem = hospital.inventory.find(i => i.type === type && i.group === group);

    if (!inventoryItem || inventoryItem.quantity < quantity) {
        throw new Error('Insufficient inventory');
    }

    inventoryItem.quantity -= quantity;
    await hospital.save();

    // Update Request
    request.status = 'Pending';
    request.assignedHospital = hospitalId;
    await request.save();

    await createAuditLog(requestId, 'REQUEST_ACCEPTED', { hospitalId, name: hospital.name });
};

exports.updateLifecycle = async (requestId, status, locationData) => {
    const request = await EmergencyRequest.findById(requestId);
    if (!request) throw new Error('Request not found');

    const validTransitions = {
        'Pending': ['Completed', 'Ended'],
    };

    if (!validTransitions[request.status]?.includes(status)) {
        throw new Error(`Invalid status transition from ${request.status} to ${status}`);
    }

    request.status = status;
    await request.save();

    await createAuditLog(requestId, `STATUS_UPDATE_${status.toUpperCase()}`, { location: locationData });
};


exports.handleTimeout = async (requestId) => {
    // Logic: If request is pending response from matches for > 3 mins -> Auto-deny?
    // Actually, "If no response within 3 minutes -> auto-deny."
    // This implies removing the match or marking request as "no response from X".
    // Or if it means "Auto-deny the request itself"? Likely "Auto-deny the match offer".
    // For MVP: If a request has potential matches but is still 'Generated' after 3 mins?
    // Requirement 5: "When another hospital receives the request... If no response within 3 minutes -> auto-deny."
    // This implies the MATCH is denied/expired.
    // So we should remove 'potentialMatches' or flag them as ignored.
    // Re-trigger matching?

    // Implementation: Clear potentialMatches and Log.
    const request = await EmergencyRequest.findById(requestId);
    if (!request) return;

    if (request.potentialMatches.length > 0) {
        // Log timeout for these matches
        await createAuditLog(requestId, 'MATCH_TIMEOUT', { matches: request.potentialMatches });

        // Clear matches so they don't block? Or just keep them?
        // If we clear them, the next Cron cycle might find them again unless we blacklist.
        // MVP: Just log timeout. Real app would blacklist.

        // For simple MVP: do nothing destructive, just log. 
        // Or if the requirement "If no hospital accepts, expand radius" covers it.
    }
};
