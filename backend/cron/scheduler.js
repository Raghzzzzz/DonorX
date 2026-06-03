const cron = require('node-cron');
const EmergencyRequest = require('../models/EmergencyRequest');
const workflowService = require('../services/workflowService');

const startScheduler = () => {
    cron.schedule('*/1 * * * *', async () => {
        console.log('Running Workflow Scheduler...');

        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        try {
            const requestsToExpand = await EmergencyRequest.find({
                status: 'Generated',
                updatedAt: { $lt: fiveMinutesAgo },
            });

            for (const req of requestsToExpand) {
                console.log(`Expanding radius for request ${req._id}`);
                await workflowService.expandSearchRadius(req._id);
            }
        } catch (error) {
            console.error('Scheduler Error:', error);
        }
    });

    cron.schedule('*/3 * * * *', async () => {
        console.log('Running Timeout Scheduler...');

        const now = new Date();
        const threeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000);

        try {
            const timedOutRequests = await EmergencyRequest.find({
                status: 'Generated',
                potentialMatches: { $exists: true, $not: { $size: 0 } },
                updatedAt: { $lt: threeMinutesAgo },
            });

            for (const req of timedOutRequests) {
                console.log(`Handling timeout for request ${req._id}`);
                await workflowService.handleTimeout(req._id);
            }
        } catch (error) {
            console.error('Timeout Scheduler Error:', error);
        }
    });

    console.log('Workflow Scheduler started.');
};

module.exports = startScheduler;
