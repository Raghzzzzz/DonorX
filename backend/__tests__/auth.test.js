jest.mock('mongoose', () => {
    const actual = jest.requireActual('mongoose');
    return {
        ...actual,
        connect: jest.fn().mockResolvedValue({ connection: { host: 'localhost' } }),
        Types: actual.Types,
    };
});

const Hospital = require('../models/Hospital');

jest.mock('../models/Hospital');

const request = require('supertest');
const app = require('../app');

describe('POST /api/auth/login', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 400 if email is missing', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ password: 'secret123' });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/email/i);
    });

    it('returns 400 if password is missing', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@hospital.com' });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/password/i);
    });

    it('returns 401 for wrong credentials', async () => {
        Hospital.findOne.mockResolvedValue(null);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'wrong@hospital.com', password: 'badpass' });

        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/invalid/i);
    });
});
