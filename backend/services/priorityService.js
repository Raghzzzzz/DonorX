// Rule-based priority scoring
// Score range: 0-100

exports.calculatePriority = (request) => {
    let score = 0;

    // 1. Urgency Level (Max 50)
    const urgencyScores = {
        'Critical': 50,
        'High': 40,
        'Medium': 20,
        'Low': 10
    };
    score += urgencyScores[request.urgency] || 0;

    // 2. Condition Severity (Max 20) - Simple mapping example
    // Handle partial matches (e.g., "Trauma / Accident" contains "Trauma")
    const condition = request.condition || '';
    let conditionScore = 10; // Default
    
    if (condition.includes('Trauma') || condition.includes('Accident')) {
        conditionScore = 20;
    } else if (condition.includes('Organ Transplant') || condition.includes('Transplant')) {
        conditionScore = 20;
    } else if (condition.includes('Surgery')) {
        conditionScore = 15;
    } else if (condition.includes('ICU') || condition.includes('Critical Care')) {
        conditionScore = 10;
    }
    
    score += conditionScore;

    // 3. Time Elapsed (Max 20)
    // Increases by 1 point every 10 minutes, max 20
    // Handle case where createdAt might not exist yet (during initial creation)
    if (request.createdAt) {
        const minutesElapsed = (Date.now() - new Date(request.createdAt).getTime()) / (1000 * 60);
        const timeScore = Math.min(Math.floor(minutesElapsed / 10), 20);
        score += timeScore;
    }
    // If createdAt doesn't exist yet, timeScore is 0 (new request)

    // 4. Resource Rarity (Max 10) - Mock logic
    if (request.resourceNeeded && request.resourceNeeded.type) {
        const rareGroups = ['AB-', 'B-', 'O-'];
        if (request.resourceNeeded.type === 'BLOOD' && request.resourceNeeded.group && rareGroups.includes(request.resourceNeeded.group)) {
            score += 10;
        }
        if (request.resourceNeeded.type === 'ORGAN') {
            score += 10; // Organs are always rare
        }
    }

    return Math.min(score, 100);
};
