const Hospital = require('../models/Hospital');

const compatibility = {
    'O-': ['O-'],
    'O+': ['O-', 'O+'],
    'A-': ['O-', 'A-'],
    'A+': ['O-', 'O+', 'A-', 'A+'],
    'B-': ['O-', 'B-'],
    'B+': ['O-', 'O+', 'B-', 'B+'],
    'AB-': ['O-', 'A-', 'B-', 'AB-'],
    'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

const RESOURCE_TYPES = ['ICU_BED', 'VENTILATOR', 'OXYGEN_CYLINDER', 'AMBULANCE'];

const getResourceCategory = (resourceNeeded) => {
    if (resourceNeeded.resourceCategory) return resourceNeeded.resourceCategory;
    if (RESOURCE_TYPES.includes(resourceNeeded.type)) return 'RESOURCE';
    if (resourceNeeded.type === 'ORGAN') return 'ORGAN';
    return 'BLOOD';
};

const isInventoryMatch = (hospital, resourceNeeded) => {
    const category = getResourceCategory(resourceNeeded);

    if (category === 'RESOURCE') {
        if (!hospital.resources || !Array.isArray(hospital.resources)) return false;
        const item = hospital.resources.find(
            (r) => r.resourceType === resourceNeeded.type && r.available >= resourceNeeded.quantity
        );
        return !!item;
    }

    if (!hospital.inventory || !Array.isArray(hospital.inventory)) return false;

    return hospital.inventory.some((item) => {
        if (item.type !== resourceNeeded.type || item.quantity < resourceNeeded.quantity) {
            return false;
        }

        if (resourceNeeded.type === 'BLOOD') {
            const compatibleGroups = compatibility[resourceNeeded.group] || [resourceNeeded.group];
            return compatibleGroups.includes(item.group);
        }

        return item.group === resourceNeeded.group;
    });
};

exports.findMatchingHospitals = async (request) => {
    try {
        const { resourceNeeded, searchRadius = 5 } = request;

        if (!resourceNeeded || !resourceNeeded.type) {
            console.warn('Invalid resourceNeeded in findMatchingHospitals');
            return [];
        }

        const category = getResourceCategory(resourceNeeded);
        if (category !== 'RESOURCE' && !resourceNeeded.group) {
            console.warn('Invalid resourceNeeded.group in findMatchingHospitals');
            return [];
        }

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

        const radiusInRadians = (searchRadius || 5) / 6378.1;

        let hospitalsInRadius = await Hospital.find({
            location: {
                $geoWithin: {
                    $centerSphere: [coordinates, radiusInRadians],
                },
            },
            _id: { $ne: request.requestingHospital },
        }).select('_id inventory resources location name');

        if (hospitalsInRadius.length === 0) {
            hospitalsInRadius = await Hospital.find({
                _id: { $ne: request.requestingHospital },
            }).select('_id inventory resources location name');
        }

        const matchedHospitals = hospitalsInRadius.filter((hospital) =>
            isInventoryMatch(hospital, resourceNeeded)
        );

        if (matchedHospitals.length === 0 && hospitalsInRadius.length > 0) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('DEMO MODE: returning all hospitals — not for production');
                return hospitalsInRadius.map((h) => h._id);
            }
            return [];
        }

        return matchedHospitals.map((h) => h._id);
    } catch (error) {
        console.error('Error in findMatchingHospitals:', error);
        return [];
    }
};
