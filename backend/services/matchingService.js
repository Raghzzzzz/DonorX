const Hospital = require('../models/Hospital');

exports.findMatchingHospitals = async (request) => {
    const { originLocation, searchRadius, resourceNeeded } = request;

    // 1. Find hospitals within radius
    // originLocation is expected to be on the request. Wait, I missed adding originLocation to the model?
    // Let me check EmergencyRequest model. I forgot originLocation! 
    // I need to fix the model first, but I can assume it's there for now or pass requestingHospital's location.
    // Actually, usually it's the requesting hospital's location.

    // We need the requesting hospital to get the location if request specific location is missing
    let coordinates;

    if (request.location && request.location.coordinates && request.location.coordinates.length === 2) {
        coordinates = request.location.coordinates;
    } else {
        const requestingHospital = await Hospital.findById(request.requestingHospital);
        if (!requestingHospital) return [];
        coordinates = requestingHospital.location.coordinates;
    }
    const radiusInRadians = searchRadius / 6378.1; // Earth radius in km

    const hospitalsInRadius = await Hospital.find({
        location: {
            $geoWithin: {
                $centerSphere: [coordinates, radiusInRadians]
            }
        },
        _id: { $ne: request.requestingHospital } // Exclude self
    });

    // 2. Filter by Inventory
    const matchedHospitals = hospitalsInRadius.filter(hospital => {
        const item = hospital.inventory.find(i =>
            i.type === resourceNeeded.type &&
            i.group === resourceNeeded.group &&
            i.quantity >= resourceNeeded.quantity
        );
        return !!item;
    });

    return matchedHospitals.map(h => h._id);
};
