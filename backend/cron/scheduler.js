const cron = require('node-cron');
const EmergencyRequest = require('../models/EmergencyRequest');
const workflowService = require('../services/workflowService');

const startScheduler = () => {
    // Run every 1 minute to check for updates
    cron.schedule('*/1 * * * *', async () => {
        console.log('Running Workflow Scheduler...');

        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        try {
            // 1. Expand Radius for requests > 5 mins old in 'Generated' status
            // Logic: Find requests where (updatedAt < 5 mins ago) AND status is Generated.
            const requestsToExpand = await EmergencyRequest.find({
                status: 'Generated',
                updatedAt: { $lt: fiveMinutesAgo }
            });

            for (const req of requestsToExpand) {
                console.log(`Expanding radius for request ${req._id}`);
                await workflowService.expandSearchRadius(req._id);
            }

            // 2. Handle Timeouts (Mock implementation for MVP)
            // Just logging for now as per service logic
        } catch (error) {
            console.error('Scheduler Error:', error);
        }
    });

    console.log('Workflow Scheduler started.');
};

module.exports = startScheduler;
