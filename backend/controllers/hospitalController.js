const Hospital = require('../models/Hospital');
const EmergencyRequest = require('../models/EmergencyRequest');

// @desc    Get all hospitals for network map / directory
// @route   GET /api/hospitals/network
// @access  Public
exports.getHospitalNetwork = async (req, res) => {
    try {
        const hospitals = await Hospital.find()
            .select('name location inventory resources')
            .lean();

        const activeCounts = await EmergencyRequest.aggregate([
            { $match: { status: { $in: ['Generated', 'Pending'] }, assignedHospital: { $ne: null } } },
            { $group: { _id: '$assignedHospital', count: { $sum: 1 } } },
        ]);

        const countMap = {};
        activeCounts.forEach((item) => {
            countMap[String(item._id)] = item.count;
        });

        const network = hospitals.map((h) => ({
            _id: h._id,
            name: h.name,
            location: h.location,
            inventory: h.inventory || [],
            resources: h.resources || [],
            activeEmergencies: countMap[String(h._id)] || 0,
        }));

        res.json(network);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
