const asyncHandler = require('../middleware/asyncHandler');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const generateClinicalSupport = async (reportText) => {
    try {
        if (!process.env.GEMINI_API_KEY || !reportText?.trim()) return null;

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt =
            `You are a clinical decision support assistant helping hospital staff in India.\n` +
            `Based on this medical report text, provide:\n` +
            `1. Top 3 possible conditions (be concise, one line each)\n` +
            `2. Recommended immediate tests (max 3)\n` +
            `3. Risk level: Low / Medium / High / Critical\n` +
            `4. One-line clinical note for the receiving doctor\n\n` +
            `Format your response as JSON only, no markdown, no explanation:\n` +
            `{\n` +
            `  "possibleConditions": ["...", "...", "..."],\n` +
            `  "recommendedTests": ["...", "...", "..."],\n` +
            `  "riskLevel": "High",\n` +
            `  "clinicalNote": "..."\n` +
            `}\n\n` +
            `Report text: ${reportText}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Gemini clinical support error:', error);
        return null;
    }
};

// Extract value from structured label (e.g. "Patient Name: John Doe" or "Blood Group : O+")
const extractLabelValue = (text, labels) => {
    const lines = text.split(/[\r\n]+/);
    for (const line of lines) {
        for (const label of labels) {
            const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const re = new RegExp(`^${escaped}\\s*[:=-]\\s*(.+)$`, 'i');
            const m = line.trim().match(re);
            if (m && m[1]) return m[1].trim();
        }
    }
    return null;
};

// Parse emergency-related text - supports both structured reports (key: value) and free-form voice text
const parseReportText = (text) => {
    if (!text || typeof text !== 'string') return {};
    const lower = text.toLowerCase();

    const wordToNum = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };

    const bgMap = {
        'o positive': 'O+', 'o negative': 'O-', 'o plus': 'O+', 'o minus': 'O-',
        'a positive': 'A+', 'a negative': 'A-', 'a plus': 'A+', 'a minus': 'A-',
        'b positive': 'B+', 'b negative': 'B-', 'b plus': 'B+', 'b minus': 'B-',
        'ab positive': 'AB+', 'ab negative': 'AB-', 'ab plus': 'AB+', 'ab minus': 'AB-'
    };

    const normalizeBloodGroup = (val) => {
        if (!val) return '';
        const v = val.trim().toLowerCase();
        if (bgMap[v]) return bgMap[v];
        const m = v.match(/^(a|b|ab|o)[\s]*([+-]|positive|negative|plus|minus)$/i);
        if (m) {
            const g = m[1].toUpperCase();
            const rh = /^[+-]|plus|positive$/i.test(m[2]) ? '+' : '-';
            return g + rh;
        }
        const simple = ['ab+', 'ab-', 'a+', 'a-', 'b+', 'b-', 'o+', 'o-'];
        for (const bg of simple) {
            if (v === bg.toLowerCase() || v.replace(/\s/g, '') === bg.toLowerCase()) return bg.toUpperCase();
        }
        return val.toUpperCase();
    };

    const normalizeUrgency = (val) => {
        if (!val) return '';
        const v = val.trim().toLowerCase();
        if (['critical', 'high', 'medium', 'low'].includes(v)) return val.trim().charAt(0).toUpperCase() + val.trim().slice(1).toLowerCase();
        return '';
    };

    const normalizeCondition = (val) => {
        if (!val) return '';
        const v = val.trim().toLowerCase();
        const map = {
            'trauma': 'Trauma / Accident', 'accident': 'Trauma / Accident', 'trauma / accident': 'Trauma / Accident',
            'surgery': 'Surgery', 'operation': 'Surgery',
            'organ transplant': 'Organ Transplant', 'transplant': 'Organ Transplant',
            'internal bleeding': 'Internal Bleeding', 'bleeding': 'Internal Bleeding',
            'icu': 'ICU / Critical Care', 'critical care': 'ICU / Critical Care', 'ventilator': 'ICU / Critical Care'
        };
        for (const [k, out] of Object.entries(map)) {
            if (v.includes(k)) return out;
        }
        return val.trim();
    };

    // 1. Try structured extraction first (labels like "Patient Name: John Doe")
    let patientName = extractLabelValue(text, ['patient name', 'patient name:', 'name', 'patient']);
    let bloodGroup = extractLabelValue(text, ['blood group', 'blood type', 'bg', 'blood group:']);
    if (bloodGroup) bloodGroup = normalizeBloodGroup(bloodGroup);

    let urgency = extractLabelValue(text, ['urgency', 'urgency level', 'priority']);
    if (urgency) urgency = normalizeUrgency(urgency);

    let conditionType = extractLabelValue(text, ['condition', 'condition type', 'diagnosis', 'case']);
    if (conditionType) conditionType = normalizeCondition(conditionType);

    let organType = extractLabelValue(text, ['organ type', 'organ', 'organ needed']);
    if (organType) {
        const o = organType.toLowerCase();
        if (o.includes('kidney') || o.includes('renal')) organType = 'Kidney';
        else if (o.includes('liver') || o.includes('hepatic')) organType = 'Liver';
        else if (o.includes('heart') || o.includes('cardiac')) organType = 'Heart';
        else if (o.includes('lung') || o.includes('pulmonary')) organType = 'Lungs';
        else organType = organType.trim().charAt(0).toUpperCase() + organType.trim().slice(1).toLowerCase();
    }

    let quantity = 1;
    const qtyLabel = extractLabelValue(text, ['quantity', 'units', 'units required', 'bags', 'no of units']);
    if (qtyLabel) {
        const n = parseInt(qtyLabel, 10);
        if (!isNaN(n) && n > 0) quantity = n;
        else if (wordToNum[qtyLabel.toLowerCase()]) quantity = wordToNum[qtyLabel.toLowerCase()];
    }

    let resourceType = 'blood';
    if (organType || lower.includes('organ') || lower.includes('kidney') || lower.includes('liver') || lower.includes('heart') || lower.includes('lung')) {
        resourceType = 'organ';
    }

    // 2. Fall back to free-form keyword matching for any missing fields
    if (!bloodGroup) {
        for (const [phrase, code] of Object.entries(bgMap)) {
            if (lower.includes(phrase)) { bloodGroup = code; break; }
        }
        if (!bloodGroup) {
            const simpleGroups = ['ab+', 'ab-', 'a+', 'a-', 'b+', 'b-', 'o+', 'o-'];
            for (const bg of simpleGroups) {
                if (lower.includes(bg.toLowerCase()) || lower === bg.toLowerCase() ||
                    lower.includes(bg.replace('+', ' +')) || lower.includes(bg.replace('-', ' -'))) {
                    bloodGroup = bg.toUpperCase();
                    break;
                }
            }
        }
    }

    if (!urgency) {
        if (lower.includes('critical') || lower.includes('life threatening') || lower.includes('icu') ||
            lower.includes('immediately') || lower.includes('emergency') || lower.includes('மிகவும் அவசரம்') || lower.includes('கிரிட்டிக்கல்')) {
            urgency = 'Critical';
        } else if (lower.includes('high') || lower.includes('urgent') || lower.includes('urgently') ||
            lower.includes('asap') || lower.includes('fast') || lower.includes('அவசரம்')) {
            urgency = 'High';
        } else if (lower.includes('medium') || lower.includes('moderate') || lower.includes('சராசரி')) {
            urgency = 'Medium';
        } else if (lower.includes('low') || lower.includes('minor') || lower.includes('குறைவு')) {
            urgency = 'Low';
        }
    }

    if (!conditionType) {
        if (lower.includes('trauma') || lower.includes('accident') || lower.includes('crash') ||
            lower.includes('road traffic') || lower.includes('collision') || lower.includes('விபத்து')) {
            conditionType = 'Trauma / Accident';
        } else if (lower.includes('surgery') || lower.includes('operation') || lower.includes('procedure') ||
            lower.includes('bypass') || lower.includes('அறுவை') || lower.includes('ஆப்பரேஷன்')) {
            conditionType = 'Surgery';
        } else if (lower.includes('transplant') || lower.includes('organ match') || lower.includes('உறுப்பு மாற்று')) {
            conditionType = 'Organ Transplant';
        } else if (lower.includes('bleeding') || lower.includes('haemorrhage') || lower.includes('hemorrhage') ||
            (lower.includes('blood') && lower.includes('loss')) || (lower.includes('இரத்தம்') && lower.includes('வெளி'))) {
            conditionType = 'Internal Bleeding';
        } else if (lower.includes('critical care') || lower.includes('ventilator') || lower.includes('life support')) {
            conditionType = 'ICU / Critical Care';
        }
    }

    if (!organType) {
        const organKeywords = ['kidney', 'renal', 'கிட்னி', 'liver', 'hepatic', 'லிவர்', 'heart', 'cardiac', 'இதயம்', 'lung', 'pulmonary', 'நுரையீரல்'];
        for (const w of organKeywords) {
            if (lower.includes(w)) {
                if (lower.includes('kidney') || lower.includes('renal') || lower.includes('கிட்னி')) organType = 'Kidney';
                else if (lower.includes('liver') || lower.includes('hepatic') || lower.includes('லிவர்')) organType = 'Liver';
                else if (lower.includes('heart') || lower.includes('cardiac') || lower.includes('இதயம்')) organType = 'Heart';
                else if (lower.includes('lung') || lower.includes('pulmonary') || lower.includes('நுரையீரல்')) organType = 'Lungs';
                break;
            }
        }
    }

    if (quantity === 1) {
        const qtyRegex = /(?:(\d+)|([a-z]+))\s+(?:unit|units|bag|bags|bottle|bottles|packet|packets)/i;
        const qtyMatch = lower.match(qtyRegex);
        if (qtyMatch) {
            if (qtyMatch[1]) quantity = parseInt(qtyMatch[1], 10);
            else if (qtyMatch[2] && wordToNum[qtyMatch[2]]) quantity = wordToNum[qtyMatch[2]];
        }
    }

    if (!patientName) {
        const nameStopWords = ['is', 'needs', 'requires', 'has', 'suffering', 'demands', 'wants', 'urgently', 'immediately', 'due', 'for', 'with', 'in'];
        const explicitNameMatch = text.match(/(?:patient\s+name|patient)\s+(?:is\s+)?([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
        if (explicitNameMatch && explicitNameMatch[1]) {
            const potentialName = explicitNameMatch[1].trim();
            const parts = potentialName.split(/\s+/);
            patientName = (parts.length > 1 && nameStopWords.includes(parts[1].toLowerCase())) ? parts[0] : potentialName;
        }
        if (!patientName) {
            const myNameMatch = text.match(/my\s+name\s+is\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
            if (myNameMatch && myNameMatch[1]) patientName = myNameMatch[1].trim();
        }
        if (patientName) {
            const nameParts = patientName.split(/\s+/);
            if (nameParts.length > 1 && nameStopWords.includes(nameParts[nameParts.length - 1].toLowerCase())) {
                patientName = nameParts.slice(0, -1).join(' ');
            }
        }
    }

    return { patientName, urgency, conditionType, bloodGroup, resourceType, quantity, organType };
};

/**
 * POST /api/assist/parse-report
 * Accepts a file (txt, or other text-based formats) and returns parsed emergency fields.
 */
exports.parseReport = asyncHandler(async (req, res) => {
    if (!req.file || !req.file.buffer) {
        return res.status(400).json({ message: 'No file uploaded or invalid file.' });
    }

    const ext = (req.file.originalname || '').split('.').pop().toLowerCase();

    const respondWithParsed = async (text) => {
        const parsed = parseReportText(text);
        const clinicalSupport = await generateClinicalSupport(text);
        return res.status(200).json({ parsed, clinicalSupport });
    };

    if (ext === 'txt') {
        const text = req.file.buffer.toString('utf8');
        return respondWithParsed(text);
    }

    try {
        const text = req.file.buffer.toString('utf8');
        if (text && text.trim().length > 0) {
            return respondWithParsed(text);
        }
    } catch (err) {
        // Fall through to unsupported
    }

    return res.status(400).json({
        message: 'Unsupported file type. Please upload a .txt file or other text-based report.',
    });
});
