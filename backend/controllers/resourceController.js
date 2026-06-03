const Hospital = require('../models/Hospital');

const VALID_RESOURCE_TYPES = ['ICU_BED', 'VENTILATOR', 'OXYGEN_CYLINDER', 'AMBULANCE'];

// @desc    Get hospital resources
// @route   GET /api/resources
// @access  Private
const DEFAULT_RESOURCES = [
    { resourceType: 'ICU_BED', available: 5, total: 10 },
    { resourceType: 'VENTILATOR', available: 3, total: 6 },
    { resourceType: 'OXYGEN_CYLINDER', available: 20, total: 30 },
    { resourceType: 'AMBULANCE', available: 2, total: 4 },
];

exports.getResources = async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.user._id);
        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }
        if (!hospital.resources || hospital.resources.length === 0) {
            hospital.resources = DEFAULT_RESOURCES;
            await hospital.save();
        }
        res.json(hospital.resources || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update resource available count
// @route   PUT /api/resources
// @access  Private
exports.updateResources = async (req, res) => {
    const { resourceType, available } = req.body;

    if (!resourceType || !VALID_RESOURCE_TYPES.includes(resourceType)) {
        return res.status(400).json({
            message: 'Invalid resourceType. Must be one of: ICU_BED, VENTILATOR, OXYGEN_CYLINDER, AMBULANCE',
        });
    }

    if (typeof available !== 'number' || available < 0) {
        return res.status(400).json({ message: 'available must be a non-negative number' });
    }

    try {
        const hospital = await Hospital.findById(req.user._id);
        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }

        const resourceItem = hospital.resources.find((r) => r.resourceType === resourceType);
        if (!resourceItem) {
            return res.status(404).json({ message: 'Resource type not found for this hospital' });
        }

        resourceItem.available = available;
        if (available > resourceItem.total) {
            resourceItem.total = available;
        }

        await hospital.save();
        res.json(hospital.resources);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
