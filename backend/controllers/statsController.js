const EmergencyRequest = require('../models/EmergencyRequest');
const Hospital = require('../models/Hospital');

// @desc    Get platform statistics
// @route   GET /api/stats
// @access  Public
exports.getStats = async (req, res) => {
    try {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [
            totalRequestsToday,
            totalRequestsAllTime,
            activeRequests,
            urgencyAgg,
            bloodTypeAgg,
            responseTimeAgg,
            hospitals,
            recentRequests,
        ] = await Promise.all([
            EmergencyRequest.countDocuments({ createdAt: { $gte: oneDayAgo } }),
            EmergencyRequest.countDocuments(),
            EmergencyRequest.countDocuments({ status: 'Generated' }),
            EmergencyRequest.aggregate([
                { $group: { _id: '$urgency', count: { $sum: 1 } } },
            ]),
            EmergencyRequest.aggregate([
                {
                    $match: {
                        createdAt: { $gte: sevenDaysAgo },
                        'resourceNeeded.resourceCategory': { $in: ['BLOOD', null] },
                        'resourceNeeded.type': 'BLOOD',
                    },
                },
                { $group: { _id: '$resourceNeeded.group', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 },
            ]),
            EmergencyRequest.aggregate([
                { $match: { status: 'Pending' } },
                {
                    $project: {
                        responseMinutes: {
                            $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 1000 * 60],
                        },
                    },
                },
                { $group: { _id: null, avgMinutes: { $avg: '$responseMinutes' } } },
            ]),
            Hospital.find().select('inventory resources').lean(),
            EmergencyRequest.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('assignedHospital', 'name')
                .select('patientName urgency status resourceNeeded createdAt assignedHospital'),
        ]);

        const requestsByUrgency = { Critical: 0, High: 0, Medium: 0, Low: 0 };
        urgencyAgg.forEach((item) => {
            if (requestsByUrgency[item._id] !== undefined) {
                requestsByUrgency[item._id] = item.count;
            }
        });

        const bloodInventorySummary = {};
        const resourceSummary = {
            ICU_BED: 0,
            VENTILATOR: 0,
            OXYGEN_CYLINDER: 0,
            AMBULANCE: 0,
        };

        hospitals.forEach((h) => {
            (h.inventory || []).forEach((item) => {
                if (item.type === 'BLOOD' && item.group) {
                    bloodInventorySummary[item.group] =
                        (bloodInventorySummary[item.group] || 0) + (item.quantity || 0);
                }
            });
            (h.resources || []).forEach((r) => {
                if (resourceSummary[r.resourceType] !== undefined) {
                    resourceSummary[r.resourceType] += r.available || 0;
                }
            });
        });

        const topBloodType = bloodTypeAgg.length > 0 ? bloodTypeAgg[0]._id : null;
        const averageResponseTimeMinutes =
            responseTimeAgg.length > 0
                ? Math.round(responseTimeAgg[0].avgMinutes * 10) / 10
                : 0;

        res.json({
            totalRequestsToday,
            totalRequestsAllTime,
            requestsByUrgency,
            topBloodType,
            averageResponseTimeMinutes,
            activeRequests,
            bloodInventorySummary,
            resourceSummary,
            recentRequests,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
