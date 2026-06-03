jest.mock('mongoose', () => {
    const actual = jest.requireActual('mongoose');
    return {
        ...actual,
        connect: jest.fn().mockResolvedValue({ connection: { host: 'localhost' } }),
        Types: actual.Types,
    };
});

jest.mock('../models/Hospital');
jest.mock('../models/EmergencyRequest');
jest.mock('../services/workflowService', () => ({
    processRequestMatching: jest.fn().mockResolvedValue(undefined),
    handleAcceptance: jest.fn(),
    updateLifecycle: jest.fn(),
    notifyMatchedHospitals: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../app');
const Hospital = require('../models/Hospital');

describe('POST /api/requests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 401 if no Authorization header', async () => {
        const res = await request(app)
            .post('/api/requests')
            .send({
                patientName: 'John Doe',
                urgency: 'Critical',
                condition: 'Trauma',
                resourceNeeded: { type: 'BLOOD', group: 'O+', quantity: 2 },
            });

        expect(res.status).toBe(401);
    });

    it('returns 400 if patientName is empty string', async () => {
        const hospitalId = '507f1f77bcf86cd799439011';
        const token = jwt.sign({ id: hospitalId }, process.env.JWT_SECRET);

        Hospital.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({
                _id: hospitalId,
                name: 'Test Hospital',
            }),
        });

        const res = await request(app)
            .post('/api/requests')
            .set('Authorization', `Bearer ${token}`)
            .send({
                patientName: '',
                urgency: 'Critical',
                condition: 'Trauma',
                resourceNeeded: { type: 'BLOOD', group: 'O+', quantity: 2 },
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/patientName/i);
    });
});
