const Hospital = require('../models/Hospital');

exports.findMatchingHospitals = async (request) => {
    try {
        const { resourceNeeded, searchRadius = 5 } = request;

        if (!resourceNeeded || !resourceNeeded.type || !resourceNeeded.group) {
            console.warn('Invalid resourceNeeded in findMatchingHospitals');
            return [];
        }

        // We need the requesting hospital to get the location if request specific location is missing
        let coordinates;

        if (request.location && request.location.coordinates && request.location.coordinates.length === 2) {
            coordinates = request.location.coordinates;
        } else {
            const requestingHospital = await Hospital.findById(request.requestingHospital);
            if (!requestingHospital || !requestingHospital.location || !requestingHospital.location.coordinates) {
                console.warn('No location found for request or requesting hospital');
                return [];
            }
            coordinates = requestingHospital.location.coordinates;
        }

        if (!coordinates || coordinates.length !== 2) {
            console.warn('Invalid coordinates for geospatial search');
            return [];
        }

        const radiusInRadians = (searchRadius || 5) / 6378.1; // Earth radius in km

        let hospitalsInRadius = await Hospital.find({
            location: {
                $geoWithin: {
                    $centerSphere: [coordinates, radiusInRadians]
                }
            },
            _id: { $ne: request.requestingHospital } // Exclude self
        });

        // If no hospitals in radius (e.g. only one hospital in DB, or others too far),
        // add ALL other hospitals so the second device sees the request in the incoming list (demo/MVP).
        if (hospitalsInRadius.length === 0) {
            hospitalsInRadius = await Hospital.find({
                _id: { $ne: request.requestingHospital }
            }).select('_id inventory');
        }

        // 2. Filter by Inventory
        const matchedHospitals = hospitalsInRadius.filter(hospital => {
            if (!hospital.inventory || !Array.isArray(hospital.inventory)) return false;
            const item = hospital.inventory.find(i =>
                i.type === resourceNeeded.type &&
                i.group === resourceNeeded.group &&
                i.quantity >= resourceNeeded.quantity
            );
            return !!item;
        });

        // If no inventory-based matches were found, fall back to all hospitals
        // in radius (excluding the requesting hospital). This ensures that
        // connected hospitals still see the incoming request for demo / MVP use.
        if (matchedHospitals.length === 0 && hospitalsInRadius.length > 0) {
            return hospitalsInRadius.map(h => h._id);
        }

        return matchedHospitals.map(h => h._id);
    } catch (error) {
        console.error('Error in findMatchingHospitals:', error);
        return []; // Return empty array on error, don't fail the request
    }
};
