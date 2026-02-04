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
    const conditionScores = {
        'Trauma': 20,
        'Organ Transplant': 20,
        'Surgery': 15,
        'ICU': 10
    };
    // Default to 10 if not listed
    score += conditionScores[request.condition] || 10;

    // 3. Time Elapsed (Max 20)
    // Increases by 1 point every 10 minutes, max 20
    const minutesElapsed = (Date.now() - new Date(request.createdAt).getTime()) / (1000 * 60);
    const timeScore = Math.min(Math.floor(minutesElapsed / 10), 20);
    score += timeScore;

    // 4. Resource Rarity (Max 10) - Mock logic
    const rareGroups = ['AB-', 'B-', 'O-'];
    if (request.resourceNeeded.type === 'BLOOD' && rareGroups.includes(request.resourceNeeded.group)) {
        score += 10;
    }
    if (request.resourceNeeded.type === 'ORGAN') {
        score += 10; // Organs are always rare
    }

    return Math.min(score, 100);
};
