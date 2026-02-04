const Hospital = require('../models/Hospital');

// @desc    Get hospital inventory
// @route   GET /api/inventory
// @access  Private
exports.getInventory = async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.user._id);
        res.json(hospital.inventory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update hospital inventory
// @route   PUT /api/inventory
// @access  Private
exports.updateInventory = async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.user._id);

        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }

        // Support both single item payload and batched "items" array
        const items = Array.isArray(req.body.items) && req.body.items.length > 0
            ? req.body.items
            : [req.body];

        for (const { type, group, quantity } of items) {
            if (!type || !group || typeof quantity !== 'number') {
                continue;
            }

            const normalizedType = type.toUpperCase();

            // Check if item exists
            const itemIndex = hospital.inventory.findIndex(
                (item) => item.type === normalizedType && item.group === group
            );

            if (itemIndex > -1) {
                // Update quantity
                hospital.inventory[itemIndex].quantity = quantity;
            } else {
                // Add new item
                hospital.inventory.push({ type: normalizedType, group, quantity });
            }
        }

        await hospital.save();
        res.json(hospital.inventory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
