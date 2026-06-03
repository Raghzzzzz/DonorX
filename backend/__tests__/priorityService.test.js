const { calculatePriority } = require('../services/priorityService');

describe('priorityService.calculatePriority', () => {
    it('returns a number between 0 and 100 for a Critical trauma request', () => {
        const request = {
            urgency: 'Critical',
            condition: 'Trauma / Accident',
            resourceNeeded: { type: 'BLOOD', group: 'A+', quantity: 2 },
            createdAt: new Date(),
        };

        const score = calculatePriority(request);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
    });

    it('returns higher score for Critical than Low urgency', () => {
        const base = {
            condition: 'Trauma / Accident',
            resourceNeeded: { type: 'BLOOD', group: 'A+', quantity: 1 },
            createdAt: new Date(),
        };

        const criticalScore = calculatePriority({ ...base, urgency: 'Critical' });
        const lowScore = calculatePriority({ ...base, urgency: 'Low' });

        expect(criticalScore).toBeGreaterThan(lowScore);
    });

    it('returns higher score for O- blood than A+ blood (rarity bonus)', () => {
        const base = {
            urgency: 'High',
            condition: 'Surgery',
            createdAt: new Date(),
        };

        const oNegScore = calculatePriority({
            ...base,
            resourceNeeded: { type: 'BLOOD', group: 'O-', quantity: 1 },
        });

        const aPosScore = calculatePriority({
            ...base,
            resourceNeeded: { type: 'BLOOD', group: 'A+', quantity: 1 },
        });

        expect(oNegScore).toBeGreaterThan(aPosScore);
    });
});
