const mongoose = require('mongoose');
const dotenv = require('dotenv');
// Paths adjusted for root level
const Hospital = require('./models/Hospital');
const EmergencyRequest = require('./models/EmergencyRequest');
const { createRequest, respondToRequest } = require('./controllers/requestController');
const { expandSearchRadius } = require('./services/workflowService');

dotenv.config();

const runSimulation = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/donorx');
        console.log('Connected to DB');

        // Ensure Indexes
        await Hospital.init();
        await EmergencyRequest.init();

        // Cleanup
        await Hospital.deleteMany({});
        await EmergencyRequest.deleteMany({});

        // 1. Create Hospitals
        const h1 = await Hospital.create({
            name: 'Nearby Hospital',
            email: 'h1@test.com',
            password: 'hashedpassword',
            location: { type: 'Point', coordinates: [0.01, 0.01] }, // ~1.5km away
            inventory: [{ type: 'BLOOD', group: 'A+', quantity: 5 }]
        });

        const h2 = await Hospital.create({
            name: 'Far Hospital',
            email: 'h2@test.com',
            password: 'hashedpassword',
            location: { type: 'Point', coordinates: [0.1, 0.1] }, // ~15km away
            inventory: [{ type: 'BLOOD', group: 'A+', quantity: 5 }]
        });

        const requester = await Hospital.create({
            name: 'Requester Hospital',
            email: 'req@test.com',
            password: 'hashedpassword',
            location: { type: 'Point', coordinates: [0, 0] },
            inventory: []
        });

        console.log('Hospitals Created');

        // 2. Create Request (Mocking req/res)
        const req = {
            body: {
                patientName: 'John Doe',
                urgency: 'High',
                condition: 'Trauma',
                resourceNeeded: { type: 'BLOOD', group: 'A+', quantity: 2 }
            },
            user: requester
        };

        // Let's manually create for better control in script
        const { calculatePriority } = require('./services/priorityService');
        const { processRequestMatching } = require('./services/workflowService');

        const request = await EmergencyRequest.create({
            patientName: 'John Doe',
            urgency: 'High',
            condition: 'Trauma',
            resourceNeeded: { type: 'BLOOD', group: 'A+', quantity: 2 },
            requestingHospital: requester._id,
            priorityScore: 50 // Mocked
        });
        console.log('Request Created:', request._id);

        // 3. Initial Match
        await processRequestMatching(request._id);
        let updatedReq = await EmergencyRequest.findById(request._id);
        console.log('Initial Matches:', updatedReq.potentialMatches.length); // Should be 1 (h1)

        if (updatedReq.potentialMatches.length === 1 && String(updatedReq.potentialMatches[0]) === String(h1._id)) {
            console.log('SUCCESS: Nearby hospital match found.');
        } else {
            console.log('FAILURE: Incorrect matches found. Found: ' + updatedReq.potentialMatches.length);
        }

        // 4. Expand Radius
        console.log('Expanding Search (Simulating Cron)...');
        await expandSearchRadius(request._id);
        updatedReq = await EmergencyRequest.findById(request._id);
        console.log('Matches after Expansion 1 (10km):', updatedReq.potentialMatches.length);

        await expandSearchRadius(request._id); // 15km
        updatedReq = await EmergencyRequest.findById(request._id);
        console.log('Matches after Expansion 2 (15km):', updatedReq.potentialMatches.length); // Should include h2

        if (updatedReq.potentialMatches.length >= 2) {
            console.log('SUCCESS: Radius expansion found far hospital.');
        }

        // 5. Accept Request
        console.log('Accepting Request by H1...');
        const matchH1 = updatedReq.potentialMatches.find(id => String(id) === String(h1._id));
        if (matchH1) {
            const { handleAcceptance } = require('./services/workflowService');
            await handleAcceptance(request._id, h1._id);
            updatedReq = await EmergencyRequest.findById(request._id);
            console.log('Request Status:', updatedReq.status); // Pending
            console.log('Assigned Hospital:', updatedReq.assignedHospital);

            const h1Updated = await Hospital.findById(h1._id);
            console.log('H1 Inventory:', h1Updated.inventory[0].quantity); // Should be 3 (5-2)

            if (updatedReq.status === 'Pending' && h1Updated.inventory[0].quantity === 3) {
                console.log('SUCCESS: Requests accepted and inventory updated.');
            } else {
                console.log('FAILURE: Acceptance logic failed.');
            }
        }

        console.log('Simulation Complete');
        process.exit(0);

    } catch (error) {
        console.error('Simulation Error:', error);
        process.exit(1);
    }
};

runSimulation();
